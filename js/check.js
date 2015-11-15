function getMessage(a, b) {
	var message;
	if (a === true)   {
		var message = "Переданное GIF-изображение анимировано и содержит " + b + " кадров";
		}
	else if (a === false) {
		message = "Переданное GIF-изображение не анимировано";
		}
	else if (typeof a === "number") {
		message = "Переданное SVG-изображение содержит " + a + " объектов и " + b*4 + " аттрибутов";
	}
	else if (a instanceof Array && b instanceof Array) {
		var square = 0;
		for (var i = 0; i < a.length; i++ ) {
		square += a[i]*b[i];
		}
		message = "Общая площадь артефактов сжатия: " + square +" пикселей";
	}
	else if (a instanceof Array) {
		var sum = 0;
		for (var i = 0; i < a.length; i++ ) {
		sum += a[i];
		}
		message = "Количество красных точек во всех строчках изображения: " + sum;
	}
	return message;
}

