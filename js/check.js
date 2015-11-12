function getMessage(a, b) {
	var Message;
	if (a==true)   {
		var Message = "Переданное GIF-изображение анимировано и содержит " + b + " кадров";
		}
	else if (a==false) {
		Message = "Переданное GIF-изображение не анимировано";
		}
	else if (typeof a=="number") {
		Message = "Переданное SVG-изображение содержит "+ a +" объектов и "+ b*4 +" аттрибутов";
	}
	else if (((typeof a == "object") && (a instanceof Array)) && ((typeof b == "object") && (b instanceof Array))) {
		var square=0;
		for (var i=0; i<a.length; i++ ) {
		square += a[i]*b[i];
		}
		Message = "Общая площадь артефактов сжатия: " + square +" пикселей";
	}
	else if ((typeof a == "object") && (a instanceof Array)) {
		var sum=0;
		for (var i=0; i<a.length; i++ ) {
		sum += a[i];
		}
		Message = "Количество красных точек во всех строчках изображения: "+ sum;
	}
	return Message;
}

