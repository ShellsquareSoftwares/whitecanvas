var designSurface = function () {
    var imageArray = [];
    var _check = 0;
    var _startX, _startY;
    var _mouseIsDown = 0;
    var _mouseInsideImage = false;
    var _multiDragIdentifier = false;
    var _arrayIndex;
    var _resizeAnchorPoint = "null";
    var _rightClickRecognizer = false;
    var _grouped = false;
    var newX,newY,newWidth,newHeight;
    var initialize = function (settings) {
        canvasIdentifier = settings.displayCanvas;
        contextMenu = settings.contextMenu
        border = settings.cornerWidth;
        selectionColor = settings.selectBoxColor;
        borderWidth = settings.borderWidth;
        dragBoxColor = settings.dragBoxColor;
        gridLineGap = settings.gridLineGap;
        gridLineColor = settings.gridLineColor;
        showGrid = settings.showGrid;
        arcRadius = settings.cornerCircleRadius;
        groupBoxColor = settings.groupSelectionBoxColour;
        _loadDom();
        _defineGhostCanvas();
        _gridLines();
        _bindEvents();
    }
    function _loadDom() {
        $canvas = $(canvasIdentifier)[0];
        contextMenu = $(contextMenu);
    }
    var _defineGhostCanvas = function () {
        var clickLayerIdentifier = document.createElement('canvas');
        clickLayerIdentifier.style.position = "absolute";
        clickLayerIdentifier.style.zIndex = 1;
        clickLayerIdentifier.height = $canvas.height;
        clickLayerIdentifier.width = $canvas.width;
        document.body.appendChild(clickLayerIdentifier);
        var dragLayerIdentifier = document.createElement('canvas');
        dragLayerIdentifier.style.position = "absolute";
        dragLayerIdentifier.style.zIndex = 2;
        dragLayerIdentifier.height = $canvas.height;
        dragLayerIdentifier.width = $canvas.width;
        document.body.appendChild(dragLayerIdentifier);
        var gridLayerIdentifier = document.createElement('canvas');
        gridLayerIdentifier.style.position = "absolute";
        gridLayerIdentifier.style.zIndex = -1;
        gridLayerIdentifier.height = $canvas.height;
        gridLayerIdentifier.width = $canvas.width;
        document.body.appendChild(gridLayerIdentifier);
        $gridSurface = gridLayerIdentifier;
        $selectionSurface = clickLayerIdentifier;
        $dragSurface = dragLayerIdentifier;
    }
    var _bindEvents = function () {
        $dragSurface.addEventListener("mousedown", function () {
            _dragInitiation();
            _check = 0;
        }, false);
        $dragSurface.addEventListener("mousemove", function () {
            _dragExecution();
            _check = 1;
        }, false);
        $dragSurface.addEventListener("mouseout", function () {
            _dragTermination();
            _check = 1;
        }, false);
        $dragSurface.addEventListener("mouseup", function () {
            _eventRecognizer();
        }, false);
        $dragSurface.addEventListener("contextmenu", function () {
                    event.preventDefault();
                     
        }, false);  
    }
    var _eventRecognizer = function () {
        if (_check === 0 && event.which === 1) {
            _hitImage();
        } 
        else if (_check === 0 && event.which === 3){
            _imageGropuing();
        }
        else if (_check === 1 && event.which === 1 || 2) {
            _dragTermination();
        }
    }
    var addImage = function (id, x, y, width, height) {
        var $img = $('<img src=' + id + '>');
        var imageInfo = {};
        imageInfo.image = $img;
        imageInfo.positionX = x;
        imageInfo.positionY = y;
        imageInfo.width = width;
        imageInfo.height = height;
        imageInfo.isSelected = false;
        imageInfo.stackOrder = false;
        imageArray.push(imageInfo);
        var ctx = $canvas.getContext("2d");
        $img.load(function () {
            ctx.drawImage(this, x, y, width, height);
        });
    }
    var _hitImage = function () {
        if(!_rightClickRecognizer){
        var flag = 0;
        _mouseIsDown = 0;
        var sctx = $selectionSurface.getContext("2d");
        var pos = _getMousePos($dragSurface, event);
        var len = imageArray.length;
        if(!_grouped){
            for (i = 0; i < len; i++) {
                imageArray[i].isSelected = false;
                imageArray[i].stackOrder = false;
            }
        }
        _startX = endX = pos.x;
        _startY = endY = pos.y;
        for (var i = len - 1; i > -1; i--) {
            var x1 = imageArray[i].positionX;
            var y1 = imageArray[i].positionY;
            var x2 = imageArray[i].positionX + imageArray[i].width;
            var y2 = imageArray[i].positionY + imageArray[i].height;

            if ((_startX < x2 + (border / 2) && _startX > x1 - (border / 2)) &&
                (_startY < y2 + (border / 2) && _startY > y1 - (border / 2))) {
                sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
                imageArray[i].stackOrder = true;
                _addStroke(i);
                flag = 1;
                }
                // return;
            if((_startX < newX+newWidth + (border / 2) && _startX > newX - (border / 2)) &&
                (_startY < newY+newHeight + (border / 2) && _startY > newY - (border / 2))){
                imageArray[i].stackOrder = true;
                flag = 1;
                return; 
                }
            }
        if (flag == 0) {
            sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
        }
        }
    }
    var _dragInitiation = function () {
        if (!_rightClickRecognizer) {

            event.preventDefault();
            var sctx = $selectionSurface.getContext("2d");
            _mouseIsDown = 1;
            var pos = _getMousePos($dragSurface, event);
            _startX = pos.x;
            _startY = pos.y;
            _mouseInsideImage = false;
            var len = imageArray.length;
            for (i = len - 1; i > -1; i--) {
                if (!_grouped) {
                    var x1 = imageArray[i].positionX;
                    var y1 = imageArray[i].positionY;
                    var x2 = imageArray[i].positionX + imageArray[i].width;
                    var y2 = imageArray[i].positionY + imageArray[i].height;
                    if ((_startX < x2 + (border / 2) && _startX > x1 - (border / 2)) &&
                        (_startY < y2 + (border / 2) && _startY > y1 - (border / 2))) {
                        if (imageArray[i].isSelected) {
                            _arrayIndex = i;
                            _mouseInsideImage = true;
                            imageArray[i].stackOrder = true;
                            _resizeAnchorPoint = _hitResizeAnchor(_startX, _startY);
                        }
                        else {
                            for (var j = 0; j < len; j++) {
                                imageArray[j].isSelected = false;
                            }
                            _arrayIndex = i;
                            _mouseInsideImage = true;
                            imageArray[i].isSelected = true;
                            imageArray[i].stackOrder = true;
                            _resizeAnchorPoint = _hitResizeAnchor(_startX, _startY);
                            return;
                        }
                    }
                    else {
                        imageArray[i].stackOrder = false;
                    }
                }
                if (_grouped) {
                    if ((_startX < newX + newWidth) && (_startX > newX) &&
                        (_startY < newY + newHeight) && (_startY > newY)) {
                        _arrayIndex = i;
                        _mouseInsideImage = true;
                        imageArray[i].stackOrder = true;
                        _resizeAnchorPoint = _hitResizeAnchor(_startX, _startY);
                    }
                    else {
                        for (var j = 0; j < len; j++) {
                            imageArray[j].isSelected = false;
                            _grouped = false;
                        }
                        if ((_startX < x2 + (border / 2) && _startX > x1 - (border / 2)) &&
                            (_startY < y2 + (border / 2) && _startY > y1 - (border / 2))) {
                            _arrayIndex = i;
                            _mouseInsideImage = true;
                            imageArray[i].isSelected = true;
                            imageArray[i].stackOrder = true;
                            _resizeAnchorPoint = _hitResizeAnchor(_startX, _startY);
                            return;
                        }
                        else {
                            imageArray[i].isSelected = false;
                            imageArray[i].stackOrder = false;
                        }

                    }
                }
            }
        }
    }
    var _dragExecution = function () {
        event.preventDefault();
        if (_mouseIsDown == 1) {
            if (_mouseInsideImage && _resizeAnchorPoint == "null") {
                _ImageDrag();
            } else if (_mouseInsideImage && (_resizeAnchorPoint !== "null")) {
                var pos = _getMousePos($dragSurface, event);
                var _startX = pos.x;
                var _startY = pos.y;
                _resizeFunctions[_resizeAnchorPoint](_startX, _startY);
                _redrawImage();
            } else {
                $dragSurface.style.cursor = "crosshair";
                var pos = _getMousePos($dragSurface, event);
                endX = pos.x;
                endY = pos.y;
                _multiSelect(endX, endY);
            }
        } 
        else {
            var pos = _getMousePos($dragSurface, event);
            var hoverX = pos.x;
            var hoverY = pos.y;
            var len = imageArray.length;
            for (var i = len - 1; i > -1; i--) {
                if (_grouped) {
                    if ((hoverX < newX + newWidth + (border / 2)) && (hoverX > newX - (border / 2)) &&
                        (hoverY < newY + newHeight + (border / 2)) && (hoverY > newY - (border / 2))) {
                        _arrayIndex = i;
                        _hoverProperty(hoverX, hoverY);
                        return;
                    }
                    else {
                        $dragSurface.style.cursor = "default";
                    }
                }
                if (!_grouped) {
                    var x1 = imageArray[i].positionX;
                    var y1 = imageArray[i].positionY;
                    var x2 = imageArray[i].positionX + imageArray[i].width;
                    var y2 = imageArray[i].positionY + imageArray[i].height;
                    if ((hoverX < x2 + (border / 2) && hoverX > x1 - (border / 2)) &&
                        (hoverY < y2 + (border / 2) && hoverY > y1 - (border / 2))) {
                        _arrayIndex = i;
                        _hoverProperty(hoverX, hoverY);
                        return;
                    } else {
                        $dragSurface.style.cursor = "default";
                    }
                }
            }
        }
    }
    var _dragTermination = function () {
        event.preventDefault();
        var dctx = $dragSurface.getContext("2d");
        $dragSurface.style.cursor = "default";
        _mouseIsDown = 0;
        dctx.clearRect(0, 0, $dragSurface.width, $dragSurface.height);
        var len = imageArray.length;
        _mouseInsideImage = false;
        if (!_multiDragIdentifier) {
            for (var i = 0; i < len; i++) {
                imageArray[i].isSelected = false;
            }
        }
    }
    var _multiSelect = function (endX, endY) {
        var dctx = $dragSurface.getContext("2d");
        var sctx = $selectionSurface.getContext("2d");
        var w = endX - _startX;
        var h = endY - _startY;
        var offsetX = (w < 0) ? w : 0;
        var offsetY = (h < 0) ? h : 0;
        var width = Math.abs(w);
        var height = Math.abs(h);
        dctx.clearRect(0, 0, $dragSurface.width, $dragSurface.height);
        dctx.beginPath();
        dctx.rect(_startX + offsetX, _startY + offsetY, width, height);
        dctx.strokeStyle = dragBoxColor;
        dctx.setLineDash([15, 10]);
        dctx.stroke();
        sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
        var len = imageArray.length;
        for (i = 0; i < len; i++) {
            var x1 = imageArray[i].positionX;
            var y1 = imageArray[i].positionY;
            var x2 = imageArray[i].positionX + imageArray[i].width;
            var y2 = imageArray[i].positionY + imageArray[i].height;
            if (x1 < (_startX + offsetX + width) &&
                x2 > (_startX + offsetX) &&
                y1 < (_startY + offsetY + height) &&
                y2 > _startY + offsetY) {
                _addStroke(i);
                imageArray[i].isSelected = true;
                imageArray[i].stackOrder = true;
                _multiDragIdentifier = true;
            } else {
                imageArray[i].isSelected = false;
                imageArray[i].stackOrder = false;
            }
        }
    }
    var _ImageDrag = function () {
        var pos = _getMousePos($dragSurface, event);
        endX = pos.x;
        endY = pos.y;
        var dx = endX - _startX;
        var dy = endY - _startY;
        var len = imageArray.length;
        if (!_grouped) {
            var sctx = $selectionSurface.getContext("2d");
            sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
            for (var i = 0; i < len; i++) {
                var r = imageArray[i];
                if (r.isSelected) {
                    r.positionX += dx;
                    r.positionY += dy;
                    _addStroke(i);
                }
            }
        }
        if (_grouped) {
            for (var i = 0; i < len; i++) {
                var r = imageArray[i];
                if (r.isSelected) {
                    r.positionX += dx;
                    r.positionY += dy;
                    _addGroupStroke();
                }
            }
            // _grouped = false;
        }
        _redrawImage();
        _startX = endX;
        _startY = endY;
    }
    var _hitResizeAnchor = function (x, y) {
        if(!_grouped){
            var x1 = imageArray[_arrayIndex].positionX;
            var y1 = imageArray[_arrayIndex].positionY;
            var x2 = imageArray[_arrayIndex].positionX + imageArray[_arrayIndex].width;
            var y2 = imageArray[_arrayIndex].positionY + imageArray[_arrayIndex].height;
            var isLeft = (x > x1 - (border / 2) && x < x1 + (border / 2));
            var isRight = (x < x2 + (border / 2) && x > x2 - (border / 2));
            var isTop = (y > y1 - (border / 2) && y < y1 + (border / 2));
            var isBottom = (y < y2 + (border / 2) && y > y2 - (border / 2));
        }
        if(_grouped){
            var isLeft = (x>newX-10 - (border / 2) && x < newX- 10 + (border / 2));
            var isRight = (x < newX+newWidth+10 + (border / 2) && x > newX+newWidth+10 - (border / 2));
            var isTop = (y > newY - (border / 2)-10 && y < newY-10 + (border / 2));
            var isBottom = (y < newY+newHeight +10+ (border / 2) && y > newY+newHeight+10 - (border / 2));
        }
        if (isTop && isLeft) {
            return ("TL");
        }
        if (isTop && isRight) {
            return ("TR");
        }
        if (isBottom && isLeft) {
            return ("BL");
        }
        if (isBottom && isRight) {
            return ("BR");
        }
        if (isTop) {
            return ("T");
        }
        if (isRight) {
            return ("R");
        }
        if (isBottom) {
            return ("B");
        }
        if (isLeft) {
            return ("L");
        } else {
            return ("null");
        }
    }
    var _resizeFunctions = {
        T: function (x, y) {
            var sctx = $selectionSurface.getContext("2d");
            sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
            var dy = imageArray[_arrayIndex].positionY - y;
            var percentage = (dy / imageArray[_arrayIndex].height) * 100;
            for (i = 0; i < imageArray.length; i++) {
                if (imageArray[i].isSelected) {
                    imageArray[i].positionY -= (imageArray[i].height / 100) * percentage;
                    imageArray[i].height += (imageArray[i].height / 100) * percentage;
                    _addStroke(i);
                }
            }
        },
        R: function (x, y) {
            var sctx = $selectionSurface.getContext("2d");
            sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
            var dx = (imageArray[_arrayIndex].positionX + imageArray[_arrayIndex].width) - x;
            var percentage = (dx / imageArray[_arrayIndex].width) * 100;
            for (i = 0; i < imageArray.length; i++) {
                if (imageArray[i].isSelected) {
                    imageArray[i].width -= (imageArray[i].width / 100) * percentage;
                    _addStroke(i);
                }
            }
        },
        B: function (x, y) {
            var sctx = $selectionSurface.getContext("2d");
            sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
            var dy = (imageArray[_arrayIndex].positionY + imageArray[_arrayIndex].height) - y;
            var percentage = (dy / imageArray[_arrayIndex].height) * 100;
            for (i = 0; i < imageArray.length; i++) {
                if (imageArray[i].isSelected) {
                    imageArray[i].height -= (imageArray[i].height / 100) * percentage;
                    _addStroke(i);
                }
            }
        },
        L: function (x, y) {
            var sctx = $selectionSurface.getContext("2d");
            sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
            var dx = imageArray[_arrayIndex].positionX - x;
            var percentage = (dx / imageArray[_arrayIndex].width) * 100;
            for (i = 0; i < imageArray.length; i++) {
                if (imageArray[i].isSelected) {
                    imageArray[i].positionX -= (imageArray[i].width / 100) * percentage;
                    imageArray[i].width += (imageArray[i].width / 100) * percentage;
                    _addStroke(i);
                }
            }
        },
        TR: function (x, y) {
            var sctx = $selectionSurface.getContext("2d");
            sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
            var dy = imageArray[_arrayIndex].positionY - y;
            var yPercentage = (dy / imageArray[_arrayIndex].height) * 100;
            var dx = x - (imageArray[_arrayIndex].positionX + imageArray[_arrayIndex].width);
            var xPercentage = (dx / imageArray[_arrayIndex].width) * 100;
            for (i = 0; i < imageArray.length; i++) {
                if (imageArray[i].isSelected) {
                    imageArray[i].positionY -= (imageArray[i].height / 100) * yPercentage;
                    imageArray[i].height += (imageArray[i].height / 100) * yPercentage;
                    imageArray[i].width += (imageArray[i].width / 100) * xPercentage;
                    _addStroke(i);
                }
            }
        },
        BR: function (x, y) {
            var sctx = $selectionSurface.getContext("2d");
            sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
            var dy = y - (imageArray[_arrayIndex].positionY + imageArray[_arrayIndex].height);
            var yPercentage = (dy / imageArray[_arrayIndex].height) * 100;
            var dx = x - (imageArray[_arrayIndex].positionX + imageArray[_arrayIndex].width);
            var xPercentage = (dx / imageArray[_arrayIndex].width) * 100;
            for (i = 0; i < imageArray.length; i++) {
                if (imageArray[i].isSelected) {
                    imageArray[i].height += (imageArray[i].height / 100) * yPercentage;
                    imageArray[i].width += (imageArray[i].width / 100) * xPercentage;
                    _addStroke(i);
                }
            }
        },
        BL: function (x, y) {
            var sctx = $selectionSurface.getContext("2d");
            sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
            var dy = y - (imageArray[_arrayIndex].positionY + imageArray[_arrayIndex].height);
            var yPercentage = (dy / imageArray[_arrayIndex].height) * 100;
            var dx = imageArray[_arrayIndex].positionX - x;
            var xPercentage = (dx / imageArray[_arrayIndex].width) * 100;
            for (i = 0; i < imageArray.length; i++) {
                if (imageArray[i].isSelected) {
                    imageArray[i].height += (imageArray[i].height / 100) * yPercentage;
                    imageArray[i].positionX -= (imageArray[i].width / 100) * xPercentage;
                    imageArray[i].width += (imageArray[i].width / 100) * xPercentage;
                    _addStroke(i);
                }
            }
        },
        TL: function (x, y) {
            var sctx = $selectionSurface.getContext("2d");
            sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
            var dx = imageArray[_arrayIndex].positionX - x;
            var xPercentage = (dx / imageArray[_arrayIndex].width) * 100;
            var dy = imageArray[_arrayIndex].positionY - y;
            var yPercentage = (dy / imageArray[_arrayIndex].height) * 100;
            for (i = 0; i < imageArray.length; i++) {
                if (imageArray[i].isSelected) {
                    imageArray[i].positionY -= (imageArray[i].height / 100) * yPercentage;
                    imageArray[i].height += (imageArray[i].height / 100) * yPercentage;
                    imageArray[i].positionX -= (imageArray[i].width / 100) * xPercentage;
                    imageArray[i].width += (imageArray[i].width / 100) * xPercentage;
                    _addStroke(i);
                }
            }
        },
    };
    var bringToFront = function () {
        var len = imageArray.length;
        for (i = len - 1; i > -1; i--) {
            if (imageArray[i].stackOrder) {
                imageArray.splice(imageArray.length, 0, imageArray[i]);
                imageArray.splice(i, 1);
                _redrawImage();
            }
        }
    }
    var bringToBack = function () {
        var len = imageArray.length;
        for (i = 0; i < len; i++) {
            if (imageArray[i].stackOrder) {
                imageArray.splice(0, 0, imageArray[i]);
                imageArray.splice(i + 1, 1);
                _redrawImage();
            }
        }
    }
    var _redrawImage = function () {
        var ctx = $canvas.getContext("2d");
        var len = imageArray.length;
        ctx.clearRect(0, 0, $canvas.width, $canvas.height);
        for (var i = 0; i < len; i++) {
            var r = imageArray[i];
            if (r.width <= 3) {
                r.width = 3;
            }
            if (r.height <= 3) {
                r.height = 3;
            }
            ctx.drawImage(r.image[0], r.positionX, r.positionY, r.width, r.height);
        }
    }
    var _addStroke = function (_arrayIndex) {
        if (imageArray[_arrayIndex].width >= 2 && imageArray[_arrayIndex].height >= 2) {
            sctx = $selectionSurface.getContext('2d');
            var x1 = imageArray[_arrayIndex].positionX;
            var y1 = imageArray[_arrayIndex].positionY;
            var width = imageArray[_arrayIndex].width;
            var height = imageArray[_arrayIndex].height;
            var x2 = imageArray[_arrayIndex].positionX + imageArray[_arrayIndex].width;
            var y2 = imageArray[_arrayIndex].positionY + imageArray[_arrayIndex].height;
            var cx = x1 + (x2 - x1) / 2;
            var cy = y1 + (y2 - y1) / 2;
            var visilbleBorder = border - 5;
            sctx.beginPath();
            sctx.lineWidth = borderWidth;
            sctx.strokeStyle = selectionColor;
            sctx.setLineDash([10, 10]);
            sctx.fillStyle = selectionColor;
            sctx.strokeRect(x1, y1, width, height);
            sctx.fillRect(x1 - (visilbleBorder / 2), y1 - (visilbleBorder / 2), visilbleBorder, visilbleBorder);
            sctx.fillRect(x2 - (visilbleBorder / 2), y1 - (visilbleBorder / 2), visilbleBorder, visilbleBorder);
            sctx.fillRect(x2 - (visilbleBorder / 2), y2 - (visilbleBorder / 2), visilbleBorder, visilbleBorder);
            sctx.fillRect(x1 - (visilbleBorder / 2), y2 - (visilbleBorder / 2), visilbleBorder, visilbleBorder);
            sctx.fillRect(cx - (visilbleBorder / 2), y1 - (visilbleBorder / 2), visilbleBorder, visilbleBorder);
            sctx.fillRect(cx - (visilbleBorder / 2), y2 - (visilbleBorder / 2), visilbleBorder, visilbleBorder);
            sctx.fillRect(x1 - (visilbleBorder / 2), cy - (visilbleBorder / 2), visilbleBorder, visilbleBorder);
            sctx.fillRect(x2 - (visilbleBorder / 2), cy - (visilbleBorder / 2), visilbleBorder, visilbleBorder);
        }
    }
    var _addGroupStroke = function () {
        var sctx = $selectionSurface.getContext("2d");
        var allPosX = [];
        var allPosY = [];
        var allWidth = [];
        var allHeight = [];
        for (i = 0; i < imageArray.length; i++) {
            if (imageArray[i].isSelected ) {
                allPosX.push(imageArray[i].positionX);
                allPosY.push(imageArray[i].positionY);
                allWidth.push(imageArray[i].positionX + imageArray[i].width);
                allHeight.push(imageArray[i].positionY + imageArray[i].height);
            }
        }
        allPosX.sort(function (a, b) { return a - b });
        allPosY.sort(function (a, b) { return a - b });
        allWidth.sort(function (a, b) { return a - b });
        allHeight.sort(function (a, b) { return a - b });
         newX = allPosX[0];
         newY = allPosY[0];
         newWidth = allWidth[allWidth.length - 1] - newX;
         newHeight = allHeight[allHeight.length - 1] - newY;
        sctx.clearRect(0, 0, $canvas.width, $canvas.height);
        sctx.beginPath();
        sctx.lineWidth = borderWidth;
        sctx.strokeStyle = groupBoxColor;
        sctx.strokeRect(newX - 10, newY - 10, newWidth + 20, newHeight + 20);
        sctx.fillStyle = groupBoxColor;
        sctx.closePath();
        sctx.beginPath();
        sctx.arc(newX - 10, newY - 10, arcRadius, 0, 2 * Math.PI);
        sctx.fill();
        sctx.closePath();
        sctx.beginPath();
        sctx.arc(newX - 10, newY + newHeight + 10, arcRadius, 0, 2 * Math.PI);
        sctx.fill();
        sctx.closePath();
        sctx.beginPath();
        sctx.arc(newX + newWidth + 10, newY - 10, arcRadius, 0, 2 * Math.PI);
        sctx.fill();
        sctx.closePath();
        sctx.beginPath();
        sctx.arc(newX + newWidth + 10, newY + newHeight + 10, arcRadius, 0, 2 * Math.PI);
        sctx.fill();
        sctx.closePath();
        sctx.beginPath();
        sctx.arc(newX - 10, newY + (newHeight / 2), arcRadius, 0, 2 * Math.PI);
        sctx.fill();
        sctx.closePath();
        sctx.beginPath();
        sctx.arc(newX + newWidth + 10, newY + (newHeight / 2), arcRadius, 0, 2 * Math.PI);
        sctx.fill();
        sctx.closePath();
        sctx.beginPath();
        sctx.arc(newX + (newWidth / 2), newY - 10, arcRadius, 0, 2 * Math.PI);
        sctx.fill();
        sctx.closePath();
        sctx.beginPath();
        sctx.arc(newX + (newWidth / 2), newY + newHeight + 10, arcRadius, 0, 2 * Math.PI);
        sctx.fill();
        sctx.closePath();
    }

    var _imageGropuing = function () {
        event.preventDefault();
        var pageX = event.pageX;
        var pageY = event.pageY;
        contextMenu.css({ top: pageY + 2, left: pageX + 2 });
        var mwidth = contextMenu.width();
        var mheight = contextMenu.height();
        var screenWidth = $canvas.width;
        var screenHeight = $canvas.height;
        if (pageX + mwidth > screenWidth) {
            contextMenu.css({ left: pageX - mwidth });
        }
        if (pageY + mheight > screenHeight) {
            contextMenu.css({ top: pageY - mheight });
        }
        contextMenu.show();
        contextMenu.on("click", function () {
            _grouped = true;
            contextMenu.hide();
            _addGroupStroke();
        });
        $dragSurface.addEventListener("click", function () {
            contextMenu.hide();
        });
    }
   var _hoverProperty = function (endX, endY) {
        var _resizeAnchorPoint = _hitResizeAnchor(endX, endY);
        if (_resizeAnchorPoint == "TL") {
            $dragSurface.style.cursor = "nw-resize";
        }
        if (_resizeAnchorPoint == "TR") {
            $dragSurface.style.cursor = "ne-resize";
        }
        if (_resizeAnchorPoint == "BL") {
            $dragSurface.style.cursor = "sw-resize";
        }
        if (_resizeAnchorPoint == "BR") {
            $dragSurface.style.cursor = "se-resize";
        }
        if (_resizeAnchorPoint == "T") {
            $dragSurface.style.cursor = "n-resize";
        }
        if (_resizeAnchorPoint == "R") {
            $dragSurface.style.cursor = "e-resize";
        }
        if (_resizeAnchorPoint == "B") {
            $dragSurface.style.cursor = "s-resize";
        }
        if (_resizeAnchorPoint == "L") {
            $dragSurface.style.cursor = "w-resize";
        }
        if (_resizeAnchorPoint == "null") {
            $dragSurface.style.cursor = "move";
        }
    }
    var _getMousePos = function ($dragSurface, evt) {
        var rect = $dragSurface.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }
    var _gridLines = function () {
        if (showGrid) {
            var gctx = $gridSurface.getContext("2d");
            var w = $gridSurface.width,
                h = $gridSurface.height;
            for (var i = 0.5; i < w || i < h; i += gridLineGap) {
                gctx.moveTo(i, 0);
                gctx.lineTo(i, h);
                gctx.moveTo(0, i);
                gctx.lineTo(w, i);
                gctx.lineWidth = 1;
                gctx.strokeStyle = gridLineColor;
                gctx.stroke();
            }
        }
    }
    return {
        initialize: initialize,
        addImage: addImage,
        bringToFront: bringToFront,
        bringToBack: bringToBack
    }
}();
