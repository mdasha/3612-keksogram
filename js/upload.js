/* global Resizer: true */

/**
 * @fileoverview
 * @author Igor Alexeenko (o0)
 */

'use strict';

(function() {
  /** @enum {string} */
  var FileType = {
    'GIF': '',
    'JPEG': '',
    'PNG': '',
    'SVG+XML': ''
  };

  /** @enum {number} */
  var Action = {
    ERROR: 0,
    UPLOADING: 1,
    CUSTOM: 2
  };

  /**
   * Регулярное выражение, проверяющее тип загружаемого файла. Составляется
   * из ключей FileType.
   * @type {RegExp}
   */
  var fileRegExp = new RegExp('^image/(' + Object.keys(FileType).join('|').replace('\+', '\\+') + ')$', 'i');

  /**
   * @type {Object.<string, string>}
   */
  var filterMap;

  /**
   * Объект, который занимается кадрированием изображения.
   * @type {Resizer}
   */
  var currentResizer;
  /**
   * Удаляет текущий объект {@link Resizer}, чтобы создать новый с другим
   * изображением.
   */
  function cleanupResizer() {
    if (currentResizer) {
      currentResizer.remove();
      currentResizer = null;
    }
  }

  /**
   * Ставит одну из трех случайных картинок на фон формы загрузки.
   */
  function updateBackground() {
    var images = [
      'img/logo-background-1.jpg',
      'img/logo-background-2.jpg',
      'img/logo-background-3.jpg'
    ];

    var backgroundElement = document.querySelector('.upload');
    var randomImageNumber = Math.round(Math.random() * (images.length - 1));
    backgroundElement.style.backgroundImage = 'url(' + images[randomImageNumber] + ')';
  }

  /**
   * Проверяет, валидны ли данные, в форме кадрирования.
   * @return {boolean}
   */

  /* Расчет максимально возможной ширины изображения*/
  function setMaxWidth ( leftPositions , Sides ) {
    var maxWidth = 0;
    maxWidth = parseInt( leftPositions , 10 ) + parseInt( Sides , 10 );
    return maxWidth;
  }

  /* Расчет максимально возможной высоты изображения */
  function setMaxHeight ( topPositions , Sides ) {
    var maxHeight = 0;
    maxHeight = parseInt( topPositions , 10 ) + parseInt( Sides , 10 );
    return maxHeight;
  }

  var resizeForm = document.forms['upload-resize'];


  var leftPosition;
  leftPosition = resizeForm['resize-x'];

  /*Проверка, заполнено ли поле LeftPosition и его обнуление, если оно не заполнено*/
  if (leftPosition.value === "") {
    leftPosition.value = 0;
  }

  var topPosition;
  topPosition = resizeForm['resize-y'];

  /* Проверка заполнено ли поле topPosition и его обнуление, если оно не заполнено*/
  if (topPosition.value === "") {
    topPosition.value = 0;
  }

  var Side;
  Side = resizeForm['resize-size'];

  /* Проверка, заполнено ли поле Side и его обнуление, если оно не заполнено*/
  if (Side.value === "") {
    Side.value = 0;
  }
  /*Ширина обрезаемой картинки*/
  var PicWidth = setMaxWidth ( leftPosition.value , Side.value );

  /*Высота обрезаемой картинки*/
  var PicHeight = setMaxHeight ( topPosition.value , Side.value );

  /* Отливливаем значение поля слева+сторона и сверху+сторона при изменении поля сторона*/
  Side.oninput = function() {
    if (setMaxWidth ( leftPosition.value , Side.value ) > currentResizer._image.naturalWidth) {
      document.getElementById('resize-fwd').disabled = true;
    }
    else {
      if (setMaxHeight( topPosition.value , Side.value) > currentResizer._image.naturalHeight) {
        document.getElementById( 'resize-fwd' ).disabled = true;
      }
      else {
        document.getElementById( 'resize-fwd' ).disabled = false;
      }
    }
  };

  /* Отливливаем значение поля слева+сторона и сверху+сторона при изменении поля слева*/
  leftPosition.oninput = function () {
    if (setMaxWidth( leftPosition.value , Side.value ) > currentResizer._image.naturalWidth) {
      document.getElementById( 'resize-fwd' ).disabled = true;
    }

    else {
      if (setMaxHeight( topPosition.value , Side.value ) > currentResizer._image.naturalHeight) {
        document.getElementById( 'resize-fwd' ).disabled = true;
      }
      else {
        document.getElementById( 'resize-fwd' ).disabled = false;
      }
    }
  };

  /* Отливливаем значение поля сверху+сторона и слева+сторона при изменении поля сверху*/
  topPosition.oninput = function () {
    if (setMaxHeight( topPosition.value , Side.value ) > currentResizer._image.naturalHeight) {
      document.getElementById( 'resize-fwd' ).disabled = true;
    }
    else {
      if (setMaxWidth( leftPosition.value , Side.value ) > currentResizer._image.naturalWidth) {
        document.getElementById( 'resize-fwd' ).disabled = true;
      }
      else {
        document.getElementById( 'resize-fwd' ).disabled = false;
      }
    }
  };

  function resizeFormIsValid() {
    return true;
  }

  /**
   * Форма загрузки изображения.
   * @type {HTMLFormElement}
   */
  var uploadForm = document.forms['upload-select-image'];

  /**
   * Форма кадрирования изображения.
   * @type {HTMLFormElement}
   */
  var resizeForm = document.forms['upload-resize'];

  /**
   * Форма добавления фильтра.
   * @type {HTMLFormElement}
   */
  var filterForm = document.forms['upload-filter'];

  /**
   * @type {HTMLImageElement}
   */
  var filterImage = filterForm.querySelector('.filter-image-preview');

  /**
   * @type {HTMLElement}
   */
  var uploadMessage = document.querySelector('.upload-message');

  /**
   * @param {Action} action
   * @param {string=} message
   * @return {Element}
   */
  function showMessage(action, message) {
    var isError = false;

    switch (action) {
      case Action.UPLOADING:
        message = message || 'Кексограмим&hellip;';
        break;

      case Action.ERROR:
        isError = true;
        message = message || 'Неподдерживаемый формат файла<br> <a href="' + document.location + '">Попробовать еще раз</a>.';
        break;
    }

    uploadMessage.querySelector('.upload-message-container').innerHTML = message;
    uploadMessage.classList.remove('invisible');
    uploadMessage.classList.toggle('upload-message-error', isError);
    return uploadMessage;
  }

  function hideMessage() {
    uploadMessage.classList.add('invisible');
  }

  /**
   * Обработчик изменения изображения в форме загрузки. Если загруженный
   * файл является изображением, считывается исходник картинки, создается
   * Resizer с загруженной картинкой, добавляется в форму кадрирования
   * и показывается форма кадрирования.
   * @param {Event} evt
   */
  uploadForm.onchange = function(evt) {
    var element = evt.target;
    if (element.id === 'upload-file') {
      // Проверка типа загружаемого файла, тип должен быть изображением
      // одного из форматов: JPEG, PNG, GIF или SVG.
      if (fileRegExp.test(element.files[0].type)) {
        var fileReader = new FileReader();

        showMessage(Action.UPLOADING);

        fileReader.onload = function() {
          cleanupResizer();

          currentResizer = new Resizer(fileReader.result);
          currentResizer.setElement(resizeForm);
          uploadMessage.classList.add('invisible');

          uploadForm.classList.add('invisible');
          resizeForm.classList.remove('invisible');

          if (setMaxWidth( leftPosition.value , Side.value ) > currentResizer._image.naturalWidth) {
            document.getElementById( 'resize-fwd' ).disabled = true;
          }
          else {
            if (setMaxHeight( topPosition.value , Side.value ) > currentResizer._image.naturalHeight) {
              document.getElementById( 'resize-fwd' ).disabled = true;
            }
            else {
              document.getElementById( 'resize-fwd' ).disabled = false;
            }
          }

          hideMessage();
        };

        fileReader.readAsDataURL(element.files[0]);



      } else {
        // Показ сообщения об ошибке, если загружаемый файл, не является
        // поддерживаемым изображением.
        showMessage(Action.ERROR);
      }
    }
  };

  /**
   * Обработка сброса формы кадрирования. Возвращает в начальное состояние
   * и обновляет фон.
   * @param {Event} evt
   */
  resizeForm.onreset = function(evt) {
    evt.preventDefault();

    cleanupResizer();
    updateBackground();

    resizeForm.classList.add('invisible');
    uploadForm.classList.remove('invisible');
  };

  /**
   * Обработка отправки формы кадрирования. Если форма валидна, экспортирует
   * кропнутое изображение в форму добавления фильтра и показывает ее.
   * @param {Event} evt
   */
  resizeForm.onsubmit = function(evt) {
    evt.preventDefault();


    if (resizeFormIsValid()) {
      filterImage.src = currentResizer.exportImage().src;
      resizeForm.classList.add('invisible');
      filterForm.classList.remove('invisible');
    }
  };

  /**
   * Сброс формы фильтра. Показывает форму кадрирования.
   * @param {Event} evt
   */
  filterForm.onreset = function(evt) {
    evt.preventDefault();

    filterForm.classList.add('invisible');
    resizeForm.classList.remove('invisible');
  };

  /**
   * Отправка формы фильтра. Возвращает в начальное состояние, предварительно
   * записав сохраненный фильтр в cookie.
   * @param {Event} evt
   */
  filterForm.onsubmit = function(evt) {
    evt.preventDefault();

    cleanupResizer();
    updateBackground();

    filterForm.classList.add('invisible');
    uploadForm.classList.remove('invisible');
  };

  /**
   * Обработчик изменения фильтра. Добавляет класс из filterMap соответствующий
   * выбранному значению в форме.
   */
  filterForm.onchange = function() {
    if (!filterMap) {
      // Ленивая инициализация. Объект не создается до тех пор, пока
      // не понадобится прочитать его в первый раз, а после этого запоминается
      // навсегда.
      filterMap = {
        'none': 'filter-none',
        'chrome': 'filter-chrome',
        'sepia': 'filter-sepia'
      };
    }

    var selectedFilter = [].filter.call(filterForm['upload-filter'], function(item) {
      return item.checked;
    })[0].value;

    // Класс перезаписывается, а не обновляется через classList потому что нужно
    // убрать предыдущий примененный класс. Для этого нужно или запоминать его
    // состояние или просто перезаписывать.
    filterImage.className = 'filter-image-preview ' + filterMap[selectedFilter];
  };

  cleanupResizer();
  updateBackground();
})();



