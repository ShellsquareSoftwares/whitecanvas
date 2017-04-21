var designSurface = function () {
    var _elementsArray = [];
    var _activeElements = [];
    var _check = 0;
    var _startX, _startY;
    var _mouseIsDown = 0;
    var _mouseInsideElement = false;
    var _multiDragIdentifier = false;
    var _resizeAnchorPoint = "null";
    var _arrayIndex;
    var Num = 0;
    var grpNum = 0;
    var initialize = function (settings) {
        showGrid = settings.showGrid || true;
        readOnly = settings.readOnlyMode || false;
        canvasIdentifier = settings.displayCanvas;
        ungroupMenu = settings.ungroupMenu;
        groupMenu = settings.groupMenu;
        border = settings.cornerWidth || 15;
        selectionColor = settings.selectBoxColor || "rgba(0,191,255,0.5)";
        borderWidth = settings.borderWidth || 2;
        dragBoxColor = settings.dragBoxColor || "#00000";
        gridLineGap = settings.gridLineGap || 17;
        gridLineColor = settings.gridLineColor || '#dcdcdc';
        arcRadius = settings.cornerCircleRadius || 6;
        groupBoxColor = settings.groupSelectionBoxColour || "rgba(0,191,255,0.5)";
        _loadDom();
        _defineGhostCanvas();
        _gridLines();
        _bindEvents();
    }
    function _loadDom() {
        $canvas = $(canvasIdentifier)[0];
        ungroupMenu = $(ungroupMenu);
        groupMenu = $(groupMenu);
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
        if(!readOnly){
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
    }
    var _eventRecognizer = function () {
        if (_check === 0 && event.which === 1) {
            _hitImage();
        }
        else if (event.which === 3) {
            _mouseIsDown = 0;
            _groupOrUngroupSelctor();
        }
        if (_check === 1 && event.which === 1 || 3) {
            _dragTermination();
        }
    }

    var addImage = function (id, x, y, width, height) {
        var $img = $('<img src=' + id + '>');
        var imageInfo = {};
        imageInfo.image = $img;
        imageInfo.id = "IMG" + Num;
        imageInfo.positionX = x;
        imageInfo.positionY = y;
        imageInfo.width = width;
        imageInfo.height = height;
        imageInfo.childElements = null;
        imageInfo.parentElement = null;
        _elementsArray.push(imageInfo);
        Num++;
        var ctx = $canvas.getContext("2d");
        $img.load(function () {
            ctx.drawImage(this, x, y, width, height);
        });
    }
    var _hitImage = function () {
        var _activeElements = [];
        var flag = 0;
        _mouseIsDown = 0;
        var sctx = $selectionSurface.getContext("2d");
        sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
        var pos = _getMousePos($dragSurface, event);
        _startX = endX = pos.x;
        _startY = endY = pos.y;
        var len = _elementsArray.length;
        for (var i = 0; i < len; i++) {
            if (_elementsArray[i].parentElement === null) {
                if ((_startX < _elementsArray[i].positionX + _elementsArray[i].width) &&
                    (_startX > _elementsArray[i].positionX) &&
                    (_startY < _elementsArray[i].positionY + _elementsArray[i].height) &&
                    (_startY > _elementsArray[i].positionY)) {
                    _arrayIndex = i;
                    _activeElements[0] = _elementsArray[i];
                    _addStroke();
                    flag = 1;
                }
            }
        }
        if (flag === 0) {
            _activeElements.length = 0;
        }
    }
    var _dragInitiation = function () {
        var sctx = $selectionSurface.getContext("2d");
        var flag = false;
        groupMenu.hide();
        ungroupMenu.hide();
        event.preventDefault();
        _mouseIsDown = 1;
        var pos = _getMousePos($dragSurface, event);
        _startX = pos.x;
        _startY = pos.y;
        _mouseInsideElement = false;
        if (_activeElements.length >1) {
            for (var i = _activeElements.length - 1; i > -1; i--) {
                if ((_startX < _activeElements[i].positionX + _activeElements[i].width + 8) &&
                    (_startX > _activeElements[i].positionX - 8) &&
                    (_startY < _activeElements[i].positionY + _activeElements[i].height + 8) &&
                    (_startY > _activeElements[i].positionY - 8)) {
                    for (var l = 0; l < _elementsArray.length; l++) {
                        if (_elementsArray[l].id === _activeElements[i].id) {
                            _resizeAnchorPoint = _hitResizeAnchor(_startX, _startY);
                            _arrayIndex = l;
                        }
                    }
                    _mouseInsideElement = true;
                    flag = true;
                    return;
                }
            }
        }
        if (!flag) {
            for (var j = _elementsArray.length - 1; j > -1; j--) {
                if (_elementsArray[j].parentElement === null) {
                    if ((_startX < _elementsArray[j].positionX + _elementsArray[j].width + 8) &&
                        (_startX > _elementsArray[j].positionX - 8) &&
                        (_startY < _elementsArray[j].positionY + _elementsArray[j].height + 8) &&
                        (_startY > _elementsArray[j].positionY - 8)) {
                        _arrayIndex = j;
                        _mouseInsideElement = true;
                        _activeElements.length = 0;
                        _activeElements[0] = _elementsArray[j];
                        _resizeAnchorPoint = _hitResizeAnchor(_startX, _startY);
                        sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
                        _addStroke();
                        return;
                    }
                    else {
                        sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
                        _activeElements.length = 0;
                    }
                }
            }
        }
    }
    var _dragExecution = function () {
        event.preventDefault();
        if (_mouseIsDown == 1) {
            if (_mouseInsideElement && _resizeAnchorPoint == "null") {
                _ImageDrag();
            }
            else if (_mouseInsideElement && (_resizeAnchorPoint !== "null")) {
                var pos = _getMousePos($dragSurface, event);
                var _startX = pos.x;
                var _startY = pos.y;
                _resizeFunctions[_resizeAnchorPoint](_startX, _startY);
                _redrawImage();
                var sctx = $selectionSurface.getContext("2d");
                sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
                _addStroke();
            }
            else {
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
            var Len = _elementsArray.length;
            for (var i = Len - 1; i > -1; i--) {
                if ((hoverX < _elementsArray[i].positionX + _elementsArray[i].width + (border / 2)) &&
                    (hoverX > _elementsArray[i].positionX - (border / 2)) &&
                    (hoverY < _elementsArray[i].positionY + _elementsArray[i].height + (border / 2)) &&
                    (hoverY > _elementsArray[i].positionY - (border / 2))) {
                    _arrayIndex = i;
                    _hoverProperty(hoverX, hoverY);
                    return;
                }
                else {
                    $dragSurface.style.cursor = "default";
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
        _mouseInsideElement = false;
    }
    var _multiSelect = function (endX, endY) {
        var p = 0;
        _activeElements = [];
        var atleastOneGroup = false;
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
        for (var j = 0; j < _elementsArray.length; j++) {
            if (_elementsArray[j].parentElement === null) {
                var x1 = _elementsArray[j].positionX;
                var y1 = _elementsArray[j].positionY;
                var x2 = _elementsArray[j].positionX + _elementsArray[j].width;
                var y2 = _elementsArray[j].positionY + _elementsArray[j].height;
                if (x1 < (_startX + offsetX + width) &&
                    x2 > (_startX + offsetX) &&
                    y1 < (_startY + offsetY + height) &&
                    y2 > _startY + offsetY) {
                    _activeElements[p] = _elementsArray[j];
                    p++;
                    _multiDragIdentifier = true;
                    sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
                    _addStroke();
                }
            }
        }
    }
    var _ImageDrag = function () {
        var pos = _getMousePos($dragSurface, event);
        endX = pos.x;
        endY = pos.y;
        var dx = endX - _startX;
        var dy = endY - _startY;
        for (var j = 0; j < _activeElements.length; j++) {
            _activeElements[j].positionX += dx;
            _activeElements[j].positionY += dy;
            if (_activeElements[j].childElements !== null) {
                updateInnerArrayPositions(_activeElements[j].childElements, dx, dy);
            }
            var sctx = $selectionSurface.getContext("2d");
            sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
            _addStroke();
        }
        _redrawImage();
        _startX = endX;
        _startY = endY;
    }
    var updateInnerArrayPositions = function (Arr, dx, dy) {
        for (var m = 0; m < Arr.length; m++) {
            if (Arr[m].childElements !== null) {
                Arr[m].positionX += dx;
                Arr[m].positionY += dy;
                updateInnerArrayPositions(Arr[m].childElements, dx, dy);
            }
            else {
                Arr[m].positionX += dx;
                Arr[m].positionY += dy;
            }
        }
    }
    var _hitResizeAnchor = function (x, y) {
        var x1 = _elementsArray[_arrayIndex].positionX;
        var y1 = _elementsArray[_arrayIndex].positionY;
        var x2 = _elementsArray[_arrayIndex].positionX + _elementsArray[_arrayIndex].width;
        var y2 = _elementsArray[_arrayIndex].positionY + _elementsArray[_arrayIndex].height;
        var isLeft = (x > x1 - (border / 2) && x < x1 + (border / 2));
        var isRight = (x < x2 + (border / 2) && x > x2 - (border / 2));
        var isTop = (y > y1 - (border / 2) && y < y1 + (border / 2));
        var isBottom = (y < y2 + (border / 2) && y > y2 - (border / 2));
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
            var dy = _elementsArray[_arrayIndex].positionY - y;
            var percentage = (dy / _elementsArray[_arrayIndex].height) * 100;
            for (var j = 0; j < _activeElements.length; j++) {
                if (_activeElements[j].childElements) {
                    var dummyY = (_activeElements[j].positionY) - ((_activeElements[j].height / 100) * percentage);
                    _innerGroupResizing(_activeElements[j].childElements, x, dummyY, 'T', j);
                }
            }
            for (var i = 0; i < _activeElements.length; i++) {
                _activeElements[i].positionY -= (_activeElements[i].height / 100) * percentage;
                _activeElements[i].height += (_activeElements[i].height / 100) * percentage;
            }
        },
        B: function (x, y) {
            var dy = (_elementsArray[_arrayIndex].positionY + _elementsArray[_arrayIndex].height) - y;
            var percentage = (dy / _elementsArray[_arrayIndex].height) * 100;
            for (var j = 0; j < _activeElements.length; j++) {
                if (_activeElements[j].childElements) {
                    var dummyY = (_activeElements[j].positionY + _activeElements[j].height) - (((_activeElements[j].height) / 100) * percentage);
                    _innerGroupResizing(_activeElements[j].childElements, x, dummyY, 'B', j);
                }
            }
            for (var i = 0; i < _activeElements.length; i++) {
                _activeElements[i].height -= (_activeElements[i].height / 100) * percentage;
            }
        },
        L: function (x, y) {
            var dx = _elementsArray[_arrayIndex].positionX - x;
            var percentage = (dx / _elementsArray[_arrayIndex].width) * 100;
            for (var j = 0; j < _activeElements.length; j++) {
                if (_activeElements[j].childElements) {
                    var dummyX = (_activeElements[j].positionX) - ((_activeElements[j].width / 100) * percentage);
                    _innerGroupResizing(_activeElements[j].childElements, dummyX, y, 'L', j);
                }
            }
            for (var i = 0; i < _activeElements.length; i++) {
                _activeElements[i].positionX -= (_activeElements[i].width / 100) * percentage;
                _activeElements[i].width += (_activeElements[i].width / 100) * percentage;
            }
        },
        R: function (x, y) {
            var dx = (_elementsArray[_arrayIndex].positionX + _elementsArray[_arrayIndex].width) - x;
            var percentage = (dx / _elementsArray[_arrayIndex].width) * 100;
            for (var j = 0; j < _activeElements.length; j++) {
                if (_activeElements[j].childElements) {
                    var dummyX = (_activeElements[j].positionX + _activeElements[j].width) - (((_activeElements[j].width) / 100) * percentage);
                    _innerGroupResizing(_activeElements[j].childElements, dummyX, y, 'R', j);
                }
            }
            for (var i = 0; i < _activeElements.length; i++) {
                _activeElements[i].width -= (_activeElements[i].width / 100) * percentage;
            }
        },
        TR: function (x, y) {
            var dy = _elementsArray[_arrayIndex].positionY - y;
            var yPercentage = (dy / _elementsArray[_arrayIndex].height) * 100;
            var dx = x - (_elementsArray[_arrayIndex].positionX + _elementsArray[_arrayIndex].width);
            var xPercentage = (dx / _elementsArray[_arrayIndex].width) * 100;
            for (var j = 0; j < _activeElements.length; j++) {
                if (_activeElements[j].childElements) {
                    var dummyX = (_activeElements[j].positionX + _activeElements[j].width) - (((_activeElements[j].width) / 100) * (-xPercentage));
                    var dummyY = (_activeElements[j].positionY) - ((_activeElements[j].height / 100) * yPercentage);
                    _innerGroupResizing(_activeElements[j].childElements, dummyX, dummyY, 'TR', j);
                }
            }
            for (var i = 0; i < _activeElements.length; i++) {
                _activeElements[i].positionY -= (_activeElements[i].height / 100) * yPercentage;
                _activeElements[i].height += (_activeElements[i].height / 100) * yPercentage;
                _activeElements[i].width += (_activeElements[i].width / 100) * xPercentage;
            }
        },
        BR: function (x, y) {
            var dy = y - (_elementsArray[_arrayIndex].positionY + _elementsArray[_arrayIndex].height);
            var yPercentage = (dy / _elementsArray[_arrayIndex].height) * 100;
            var dx = x - (_elementsArray[_arrayIndex].positionX + _elementsArray[_arrayIndex].width);
            var xPercentage = (dx / _elementsArray[_arrayIndex].width) * 100;
            for (var j = 0; j < _activeElements.length; j++) {
                if (_activeElements[j].childElements) {
                    var dummyX = (_activeElements[j].positionX + _activeElements[j].width) - (((_activeElements[j].width) / 100) * (-xPercentage));
                    var dummyY = (_activeElements[j].positionY + _activeElements[j].height) - (((_activeElements[j].height) / 100) * (-yPercentage));
                    _innerGroupResizing(_activeElements[j].childElements, dummyX, dummyY, 'BR', j);
                }
            }
            for (var i = 0; i < _activeElements.length; i++) {
                _activeElements[i].height += (_activeElements[i].height / 100) * yPercentage;
                _activeElements[i].width += (_activeElements[i].width / 100) * xPercentage;
            }
        },
        BL: function (x, y) {
            var dy = y - (_elementsArray[_arrayIndex].positionY + _elementsArray[_arrayIndex].height);
            var yPercentage = (dy / _elementsArray[_arrayIndex].height) * 100;
            var dx = _elementsArray[_arrayIndex].positionX - x;
            var xPercentage = (dx / _elementsArray[_arrayIndex].width) * 100;
            for (var j = 0; j < _activeElements.length; j++) {
                if (_activeElements[j].childElements) {
                    var dummyX = (_activeElements[j].positionX) - ((_activeElements[j].width / 100) * xPercentage);
                    var dummyY = (_activeElements[j].positionY + _activeElements[j].height) - (((_activeElements[j].height) / 100) * (-yPercentage));
                    _innerGroupResizing(_activeElements[j].childElements, dummyX, dummyY, 'BL', j);
                }
            }
            for (var i = 0; i < _activeElements.length; i++) {
                _activeElements[i].height += (_activeElements[i].height / 100) * yPercentage;
                _activeElements[i].positionX -= (_activeElements[i].width / 100) * xPercentage;
                _activeElements[i].width += (_activeElements[i].width / 100) * xPercentage;
            }
        },
        TL: function (x, y) {
            var dx = _elementsArray[_arrayIndex].positionX - x;
            var xPercentage = (dx / _elementsArray[_arrayIndex].width) * 100;
            var dy = _elementsArray[_arrayIndex].positionY - y;
            var yPercentage = (dy / _elementsArray[_arrayIndex].height) * 100;
            for (var j = 0; j < _activeElements.length; j++) {
                if (_activeElements[j].childElements) {
                    var dummyX = (_activeElements[j].positionX) - ((_activeElements[j].width / 100) * xPercentage);
                    var dummyY = (_activeElements[j].positionY) - ((_activeElements[j].height / 100) * yPercentage);
                    _innerGroupResizing(_activeElements[j].childElements, dummyX, dummyY, 'TL', j);
                }
            }
            for (var i = 0; i < _activeElements.length; i++) {
                _activeElements[i].positionY -= (_activeElements[i].height / 100) * yPercentage;
                _activeElements[i].height += (_activeElements[i].height / 100) * yPercentage;
                _activeElements[i].positionX -= (_activeElements[i].width / 100) * xPercentage;
                _activeElements[i].width += (_activeElements[i].width / 100) * xPercentage;
            }
        },
    };
    var _innerGroupResizing = function (resizeArray, x, y, P, arr) {
        for (var l = 0; l < resizeArray.length; l++) {
            if (P === 'L') {
                var newX = _activeElements[arr].positionX;
                var newWidth = _activeElements[arr].width;
                var dx = newX - x;
                var percentageX = (dx / (newWidth)) * 100;
                effectivePX = (newX + newWidth) - (resizeArray[l].positionX);
                var widthDifference = (resizeArray[l].width / 100) * percentageX;
                var xDifference = (effectivePX / 100) * percentageX;
                resizeArray[l].positionX -= xDifference;
                resizeArray[l].width += widthDifference;
                if (resizeArray[l].childElements !== null) {
                    _innerGroupResizing(resizeArray[l].childElements, x, y, P, arr);
                }
            }
            if (P === 'R') {
                var newX = _activeElements[arr].positionX;
                var newWidth = _activeElements[arr].width;
                var dx = newX + newWidth - x;
                var percentageX = (dx / (newWidth)) * 100;
                effectivePX = resizeArray[l].positionX - newX;
                var widthDifference = (resizeArray[l].width / 100) * percentageX;
                var xDifference = (effectivePX / 100) * percentageX;
                resizeArray[l].width -= widthDifference;
                resizeArray[l].positionX -= xDifference;
                if (resizeArray[l].childElements !== null) {
                    _innerGroupResizing(resizeArray[l].childElements, x, y, P, arr);
                }
            }
            if (P === 'B') {
                var newY = _activeElements[arr].positionY;
                var newHeight = _activeElements[arr].height;
                var dy = newY + newHeight - y;
                var percentageY = (dy / newHeight) * 100;
                var effectivePY = resizeArray[l].positionY - newY;
                var heightDifference = (resizeArray[l].height / 100) * percentageY;
                var yDifference = (effectivePY / 100) * percentageY;
                resizeArray[l].height -= heightDifference;
                resizeArray[l].positionY -= yDifference;
                if (resizeArray[l].childElements !== null) {
                    _innerGroupResizing(resizeArray[l].childElements, x, y, P, arr);
                }
            }
            if (P === 'T') {
                var newY = _activeElements[arr].positionY;
                var newHeight = _activeElements[arr].height;
                var dy = newY - y;
                var percentageY = (dy / newHeight) * 100;
                effectivePY = (newY + newHeight) - resizeArray[l].positionY;
                var heightDifference = (resizeArray[l].height / 100) * percentageY;
                var yDifference = (effectivePY / 100) * percentageY;
                resizeArray[l].height += heightDifference;
                resizeArray[l].positionY -= yDifference;
                if (resizeArray[l].childElements !== null) {
                    _innerGroupResizing(resizeArray[l].childElements, x, y, P, arr);
                }
            }
            if (P === 'BR') {
                var newY = _activeElements[arr].positionY;
                var newHeight = _activeElements[arr].height;
                var dy = y - (newY + newHeight);
                var percentageY = (dy / newHeight) * 100;
                effectivePY = resizeArray[l].positionY - newY;
                var heightDifference = (resizeArray[l].height / 100) * percentageY;
                var yDifference = (effectivePY / 100) * percentageY;
                resizeArray[l].height += heightDifference;
                resizeArray[l].positionY += yDifference;
                var newX = _activeElements[arr].positionX;
                var newWidth = _activeElements[arr].width;
                var dx = x - (newX + newWidth);
                var percentageX = (dx / (newWidth)) * 100;
                effectivePX = resizeArray[l].positionX - newX;
                var widthDifference = (resizeArray[l].width / 100) * percentageX;
                var xDifference = (effectivePX / 100) * percentageX;
                resizeArray[l].width += widthDifference;
                resizeArray[l].positionX += xDifference;
                if (resizeArray[l].childElements !== null) {
                    _innerGroupResizing(resizeArray[l].childElements, x, y, P, arr);
                }
            }
            if (P === 'BL') {
                var newY = _activeElements[arr].positionY;
                var newHeight = _activeElements[arr].height;
                var dy = newY + newHeight - y;
                var percentageY = (dy / newHeight) * 100;
                effectivePY = resizeArray[l].positionY - newY;
                var heightDifference = (resizeArray[l].height / 100) * percentageY;
                var yDifference = (effectivePY / 100) * percentageY;
                resizeArray[l].height -= heightDifference;
                resizeArray[l].positionY -= yDifference;
                var newX = _activeElements[arr].positionX;
                var newWidth = _activeElements[arr].width;
                var dx = newX - x;
                var percentageX = (dx / (newWidth)) * 100;
                effectivePX = (newX + newWidth) - (resizeArray[l].positionX);
                var widthDifference = (resizeArray[l].width / 100) * percentageX;
                var xDifference = (effectivePX / 100) * percentageX;
                resizeArray[l].positionX -= xDifference;
                resizeArray[l].width += widthDifference;
                if (resizeArray[l].childElements !== null) {
                    _innerGroupResizing(resizeArray[l].childElements, x, y, P, arr);
                }
            }
            if (P === 'TL') {
                var newY = _activeElements[arr].positionY;
                var newHeight = _activeElements[arr].height;
                var dy = newY - y;
                var percentageY = (dy / newHeight) * 100;
                effectivePY = (newY + newHeight) - resizeArray[l].positionY;
                var heightDifference = (resizeArray[l].height / 100) * percentageY;
                var yDifference = (effectivePY / 100) * percentageY;
                resizeArray[l].height += heightDifference;
                resizeArray[l].positionY -= yDifference;
                var newX = _activeElements[arr].positionX;
                var newWidth = _activeElements[arr].width;
                var dx = newX - x;
                var percentageX = (dx / (newWidth)) * 100;
                effectivePX = (newX + newWidth) - (resizeArray[l].positionX);
                var widthDifference = (resizeArray[l].width / 100) * percentageX;
                var xDifference = (effectivePX / 100) * percentageX;
                resizeArray[l].positionX -= xDifference;
                resizeArray[l].width += widthDifference;
                if (resizeArray[l].childElements !== null) {
                    _innerGroupResizing(resizeArray[l].childElements, x, y, P, arr);
                }
            }
            if (P === 'TR') {
                var newY = _activeElements[arr].positionY;
                var newHeight = _activeElements[arr].height;
                var dy = newY - y;
                var percentageY = (dy / newHeight) * 100;
                effectivePY = (newY + newHeight) - resizeArray[l].positionY;
                var heightDifference = (resizeArray[l].height / 100) * percentageY;
                var yDifference = (effectivePY / 100) * percentageY;
                resizeArray[l].height += heightDifference;
                resizeArray[l].positionY -= yDifference;
                var newX = _activeElements[arr].positionX;
                var newWidth = _activeElements[arr].width;
                var dx = newX + newWidth - x;
                var percentageX = (dx / (newWidth)) * 100;
                effectivePX = resizeArray[l].positionX - newX;
                var widthDifference = (resizeArray[l].width / 100) * percentageX;
                var xDifference = (effectivePX / 100) * percentageX;
                resizeArray[l].width -= widthDifference;
                resizeArray[l].positionX -= xDifference;
                if (resizeArray[l].childElements !== null) {
                    _innerGroupResizing(resizeArray[l].childElements, x, y, P, arr);
                }
            }
        }
    }
    var bringToFront = function () {
        var count = 0;
        var elen = _elementsArray.length;
        for (var j = 0; j < _activeElements.length; j++) {
            for (var k = 0; k < elen - count; k++) {
                if (_activeElements[j].id === _elementsArray[k].id) {
                    _elementsArray.push(_elementsArray[k]);
                    _elementsArray.splice(k, 1);
                    count++;
                }
            }
        }
        _redrawImage();
    }
    var bringToBack = function () {
        var len = _elementsArray.length;
        for (var i = 0; i < _activeElements.length; i++) {
            for (var l = 0; l < _elementsArray.length; l++) {
                if (_activeElements[i].id === _elementsArray[l].id) {
                    _elementsArray.splice(0, 0, _elementsArray[l]);
                    _elementsArray.splice(l + 1, 1);
                }
            }
        }
        _redrawImage();
    }
    var _groupOrUngroupSelctor = function (groupId) {
        groupPresent = false;
        event.preventDefault();
        var pageX = event.pageX;
        var pageY = event.pageY;
        groupMenu.css({ top: pageY + 1, left: pageX + 1 });
        if (_activeElements.length < 2) {
            ungroupMenu.css({ top: pageY + 01, left: pageX + 1 });
        }
        else {
            ungroupMenu.css({ top: pageY + 31, left: pageX + 1 });
        }
        var mwidth = groupMenu.width();
        var mheight = groupMenu.height();
        var screenWidth = $canvas.width;
        var screenHeight = $canvas.height;
        if (pageX + mwidth > screenWidth) {
            ungroupMenu.css({ left: pageX - mwidth });
            contextMenu.css({ left: pageX - mwidth });
        }
        if (pageY + mheight > screenHeight) {
            ungroupMenu.css({ top: pageY - mheight });
            contextMenu.css({ top: pageY - mheight });
        }
        for (var g = 0; g < _activeElements.length; g++) {
            if (_activeElements[g].childElements !== null) {
                groupPresent = true;
            }
        }
        if (_activeElements.length > 1) {
            groupMenu.show();
            groupMenu.unbind().click(function () {
                _groupingFunction();
                ungroupMenu.hide();
            });
        }
        if (groupPresent) {
            ungroupMenu.show();
            ungroupMenu.unbind().click(function () {
                _ungroupingFunction(groupId);
            });
        }
    }
    var _groupingFunction = function () {
        var s = 0;
        var group = {};
        dimensions = {};
        var leng = _activeElements.length;
        _calculateGroupStroke(dimensions);
        group.id = "GRP" + grpNum;
        group.positionX = dimensions.X;
        group.positionY = dimensions.Y;
        group.width = dimensions.W;
        group.height = dimensions.H;
        group.childElements = [];
        group.parentElement = null;
        _elementsArray.push(group);
        grpNum++;
        for (var k = 0; k < leng; k++) {
            _activeElements[k].parentElement = _elementsArray[_elementsArray.length - 1];
            _elementsArray[_elementsArray.length - 1].childElements[s] = _activeElements[k];
            s++;
        }
        _activeElements = [_elementsArray[_elementsArray.length - 1]];
        groupMenu.hide();
        var sctx = $selectionSurface.getContext("2d");
        sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
        _addStroke();
    }
    var _ungroupingFunction = function () {
        var n = 0;
        var sctx = $selectionSurface.getContext("2d");
        for (var j = 0; j < _activeElements.length; j++) {
            if (_activeElements[j].childElements !== null) {
                for (var k = 0; k < _elementsArray.length; k++) {
                    if (_elementsArray[k].id === _activeElements[j].id) {
                        for (var l = 0; l < _elementsArray[k].childElements.length; l++) {
                            _elementsArray[k].childElements[l].parentElement = null;
                        }
                        delete _elementsArray[k];
                        n++;
                    }
                }
            }
        }
        _elementsArray.sort();
        _elementsArray.splice(_elementsArray.length - n, n);
        ungroupMenu.hide();
        _activeElements.length = 0;
        sctx.clearRect(0, 0, $selectionSurface.width, $selectionSurface.height);
    }
    var _redrawImage = function () {
        var ctx = $canvas.getContext("2d");
        var len = _elementsArray.length;
        ctx.clearRect(0, 0, $canvas.width, $canvas.height);
        for (var i = 0; i < len; i++) {
            if (_elementsArray[i].parentElement === null) {
                var r = _elementsArray[i];
                if (r.width <= 5) {
                    r.width = 5;
                }
                if (r.height <= 5) {
                    r.height = 5;
                }
                if (r.childElements !== null) {
                    _drawInnerImages(r.childElements);
                }
                else {

                    ctx.drawImage(r.image[0], r.positionX, r.positionY, r.width, r.height);
                }
            }
        }
    }
    var _drawInnerImages = function (Arrays) {
        var ctx = $canvas.getContext("2d");
        for (var k = 0; k < Arrays.length; k++) {
            if (Arrays[k].childElements !== null) {
                _drawInnerImages(Arrays[k].childElements);
            }
            else {
                if (Arrays[k].width <= 3) {
                    Arrays[k].width = 3;
                }
                if (Arrays[k].height <= 3) {
                    Arrays[k].height = 3;
                }
                ctx.drawImage(Arrays[k].image[0], Arrays[k].positionX, Arrays[k].positionY, Arrays[k].width, Arrays[k].height);
            }
        }
    }
    var _calculateGroupStroke = function (dimensions) {
        _allPosX = [];
        _allPosY = [];
        _allPosW = [];
        _allPosH = [];
        for (var i = 0; i < _activeElements.length; i++) {
            _allPosX.push(_activeElements[i].positionX);
            _allPosY.push(_activeElements[i].positionY);
            _allPosW.push(_activeElements[i].positionX + _activeElements[i].width);
            _allPosH.push(_activeElements[i].positionY + _activeElements[i].height);
        }
        _allPosX.sort(function (a, b) { return a - b });
        _allPosY.sort(function (a, b) { return a - b });
        _allPosW.sort(function (a, b) { return a - b });
        _allPosH.sort(function (a, b) { return a - b });
        dimensions.X = _allPosX[0] - 10;
        dimensions.Y = _allPosY[0] - 10;
        dimensions.W = _allPosW[_allPosW.length - 1] - dimensions.X + 10;
        dimensions.H = _allPosH[_allPosH.length - 1] - dimensions.Y + 10;
        return dimensions;
    }
    var _addStroke = function () {
        var sctx = $selectionSurface.getContext("2d");
        for (var n = 0; n < _activeElements.length; n++) {
            if (_activeElements[n].childElements !== null) {
                _addGroupStroke(n);
            }
            else {
                if (_activeElements[n].width >= 2 && _activeElements[n].height >= 2) {
                    var x1 = _activeElements[n].positionX;
                    var y1 = _activeElements[n].positionY;
                    var width = _activeElements[n].width;
                    var height = _activeElements[n].height;
                    var x2 = _activeElements[n].positionX + _activeElements[n].width;
                    var y2 = _activeElements[n].positionY + _activeElements[n].height;
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
        }
    }
    var _addGroupStroke = function (arrayPos) {
        var sctx = $selectionSurface.getContext("2d");
        var selBox = _activeElements[arrayPos]
        if (selBox.width >= 2 && selBox.height >= 2) {
            sctx.beginPath();
            sctx.lineWidth = borderWidth;
            sctx.strokeStyle = groupBoxColor;
            sctx.strokeRect(selBox.positionX, selBox.positionY, selBox.width, selBox.height);
            sctx.fillStyle = groupBoxColor;
            sctx.closePath();
            sctx.beginPath();
            sctx.arc(selBox.positionX, selBox.positionY, arcRadius, 0, 2 * Math.PI);
            sctx.fill();
            sctx.closePath();
            sctx.beginPath();
            sctx.arc(selBox.positionX, selBox.positionY + selBox.height, arcRadius, 0, 2 * Math.PI);
            sctx.fill();
            sctx.closePath();
            sctx.beginPath();
            sctx.arc(selBox.positionX + selBox.width, selBox.positionY, arcRadius, 0, 2 * Math.PI);
            sctx.fill();
            sctx.closePath();
            sctx.beginPath();
            sctx.arc(selBox.positionX + selBox.width, selBox.positionY + selBox.height, arcRadius, 0, 2 * Math.PI);
            sctx.fill();
            sctx.closePath();
            sctx.beginPath();
            sctx.arc(selBox.positionX, selBox.positionY + (selBox.height / 2), arcRadius, 0, 2 * Math.PI);
            sctx.fill();
            sctx.closePath();
            sctx.beginPath();
            sctx.arc(selBox.positionX + selBox.width, selBox.positionY + (selBox.height / 2), arcRadius, 0, 2 * Math.PI);
            sctx.fill();
            sctx.closePath();
            sctx.beginPath();
            sctx.arc(selBox.positionX + (selBox.width / 2), selBox.positionY, arcRadius, 0, 2 * Math.PI);
            sctx.fill();
            sctx.closePath();
            sctx.beginPath();
            sctx.arc(selBox.positionX + (selBox.width / 2), selBox.positionY + selBox.height, arcRadius, 0, 2 * Math.PI);
            sctx.fill();
            sctx.closePath();
        }
    }
    var _hoverProperty = function (x, y) {
        var _resizeAnchorPoint = _hitResizeAnchor(x, y)
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
