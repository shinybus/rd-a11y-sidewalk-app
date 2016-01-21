var svl = svl || {};

/**
 * A Label module.
 * @param pathIn
 * @param params
 * @returns {*}
 * @constructor
 * @memberof svl
 */
function Label (pathIn, params) {
    var self = {
        className: 'Label'
    };

    var path;
    var googleMarker;

    var properties = {
        canvasWidth: undefined,
        canvasHeight: undefined,
        canvasDistortionAlphaX: undefined,
        canvasDistortionAlphaY: undefined,
        distanceThreshold: 100,
        labelerId : 'DefaultValue',
        labelId: 'DefaultValue',
        labelType: undefined,
        labelDescription: undefined,
        labelFillStyle: undefined,
        panoId: undefined,
        panoramaLat: undefined,
        panoramaLng: undefined,
        panoramaHeading: undefined,
        panoramaPitch: undefined,
        panoramaZoom: undefined,
        photographerHeading: undefined,
        photographerPitch: undefined,
        svImageWidth: undefined,
        svImageHeight: undefined,
        svMode: undefined,
        tagHeight: 20,
        tagWidth: 1,
        tagX: -1,
        tagY: -1
    };

    var status = {
        deleted : false,
        tagVisibility : 'visible',
        visibility : 'visible'
    };

    var lock = {
        tagVisibility: false,
        visibility : false
    };

    function init (param, pathIn) {
        try {
            if (!pathIn) {
                var errMsg = 'The passed "path" is empty.';
                throw errMsg;
            } else {
                path = pathIn;
            }

            for (attrName in properties) {
                // It is ok if some attributes are not passed as parameters
                if ((attrName === 'tagHeight' ||
                     attrName === 'tagWidth' ||
                     attrName === 'tagX' ||
                     attrName === 'tagY' ||
                     attrName === 'labelerId' ||
                     attrName === 'photographerPov' ||
                     attrName === 'photographerHeading' ||
                     attrName === 'photographerPitch' ||
                            attrName === 'distanceThreshold'
                    ) &&
                    !param[attrName]) {
                    continue;
                }

                // Check if all the necessary properties are set in param.
                // Checking paroperties:
                // http://www.nczonline.net/blog/2010/07/27/determining-if-an-object-property-exists/
                if (!(attrName in param)) {
                    var errMsg = '"' + attrName + '" is not in the passed parameter.';
                    throw errMsg;
                }
                properties[attrName] = param[attrName];
            }

            // Set belongs to of the path.
            path.setBelongsTo(self);

            googleMarker = createGoogleMapsMarker(param.labelType);
            googleMarker.setMap(svl.map.getMap());
            return true;
        } catch (e) {
            console.error(self.className, ':', 'Error initializing the Label object.', e);
            return false;
        }
    }

    /**
     * Blink (highlight and fade) the color of this label. If fade is true, turn the label into gray.
     * @param numberOfBlinks
     * @param fade
     * @returns {blink}
     */
    function blink (numberOfBlinks, fade) {
        if (!numberOfBlinks) {
            numberOfBlinks = 3;
        } else if (numberOfBlinks < 0) {
            numberOfBlinks = 0;
        }
        var interval;
        var highlighted = true;
        var path = self.getPath();
        var points = path.getPoints();

        var i;
        var len = points.length;

        var fillStyle = 'rgba(200,200,200,0.1)';
        var fillStyleHighlight = path.getFillStyle();

        interval = setInterval(function () {
            if (numberOfBlinks > 0) {
                if (highlighted) {
                    highlighted = false;
                    path.setFillStyle(fillStyle);
                    for (i = 0; i < len; i++) {
                        points[i].setFillStyle(fillStyle);
                    }
                    svl.canvas.clear().render2();
                } else {
                    highlighted = true;
                    path.setFillStyle(fillStyleHighlight);
                    for (i = 0; i < len; i++) {
                        points[i].setFillStyle(fillStyleHighlight);
                    }
                    svl.canvas.clear().render2();
                    numberOfBlinks -= 1;
                }
            } else {
                if (fade) {
                    path.setFillStyle(fillStyle);
                    for (i = 0; i < len; i++) {
                        points[i].setFillStyle(fillStyle);
                    }
                    svl.canvas.clear().render2();
                }

                self.setAlpha(0.05);
                svl.canvas.clear().render2();
                window.clearInterval(interval);
            }
        }, 500);

        return this;
    }

    /**
     * This method creates a Google Maps marker.
     * https://developers.google.com/maps/documentation/javascript/markers
     * https://developers.google.com/maps/documentation/javascript/examples/marker-remove
     * @returns {google.maps.Marker}
     */
    function createGoogleMapsMarker (labelType) {
        var latlng = toLatLng(),
            googleLatLng = new google.maps.LatLng(latlng.lat, latlng.lng),
            imagePaths = svl.misc.getIconImagePaths(),
            url = imagePaths[labelType].googleMapsIconImagePath

        return new google.maps.Marker({
            position: googleLatLng,
            map: svl.map.getMap(),
            title: "Hi!",
            icon: url,
            size: new google.maps.Size(20, 20)
        });
    }

    /**
     * This method turn the associated Path and Points into gray.
     * @param mode
     * @returns {fadeFillStyle}
     */
    function fadeFillStyle (mode) {
        var path = self.getPath(),
            points = path.getPoints(),
            len = points.length, fillStyle;

        if (!mode) { mode = 'default'; }

        fillStyle = mode == 'gray' ? 'rgba(200,200,200,0.5)' : 'rgba(255,165,0,0.8)';
        path.setFillStyle(fillStyle);
        for (var i = 0; i < len; i++) {
            points[i].setFillStyle(fillStyle);
        }
        return this;
    }

    /**
     * This method changes the fill color of the path and points that constitute the path.
     * @param fillColor
     * @returns {fill}
     */
    function fill (fillColor) {
        var path = self.getPath(),
            points = path.getPoints(),
            len = points.length;

        path.setFillStyle(fillColor);
        for (var i = 0; i < len; i++) { points[i].setFillStyle(fillColor); }
        return this;
    }

    /**
     * This method returns the boudning box of the label's outline.
     * @param pov
     * @returns {*}
     */
    function getBoundingBox (pov) {
        var path = self.getPath();
        return path.getBoundingBox(pov);
    }

    /**
     * This function returns the coordinate of a point.
     * @returns {*}
     */
    function getCoordinate () {
        if (path && path.points.length > 0) {
            var pov = path.getPOV();
            return $.extend(true, {}, path.points[0].getCanvasCoordinate(pov));
        }
        return path;
    }

    /**
     * This function return the coordinate of a point in the GSV image coordinate.
     * @returns {*}
     */
    function getGSVImageCoordinate () {
        if (path && path.points.length > 0) {
            return path.points[0].getGSVImageCoordinate();
        }
    }

    /**
     *
     * @returns {*}
     */
    function getImageCoordinates () { return path ? path.getImageCoordinates() : false; }

    /**
     * This function returns labelId property
     * @returns {string}
     */
    function getLabelId () { return properties.labelId; }

    /**
     * This function returns labelType property
     * @returns {*}
     */
    function getLabelType () { return properties.labelType; }

    /**
     * This function returns the coordinate of a point.
     * If reference is true, return a reference to the path instead of a copy of the path
     * @param reference
     * @returns {*}
     */
    function getPath (reference) {
        if (path) {
            return reference ? path : $.extend(true, {}, path);
        }
        return false;
    }

    /**
     * This function returns the coordinate of the first point in the path.
     * @returns {*}
     */
    function getPoint () { return (path && path.points.length > 0) ? path.points[0] : path; }

    /**
     * This function returns the point objects that constitute the path
     * If reference is set to true, return the reference to the points
     * @param reference
     * @returns {*}
     */
    function getPoints (reference) { return path ? path.getPoints(reference) : false; }

    /**
     * This method returns the pov of this label
     * @returns {{heading: Number, pitch: Number, zoom: Number}}
     */
    function getLabelPov () {
        var heading, pitch = parseInt(properties.panoramaPitch, 10),
            zoom = parseInt(properties.panoramaZoom, 10),
            points = self.getPoints(),
            svImageXs = points.map(function(point) { return point.svImageCoordinate.x; }),
            labelSvImageX;

        if (svImageXs.max() - svImageXs.min() > (svl.svImageWidth / 2)) {
            svImageXs = svImageXs.map(function (x) {
                if (x < (svl.svImageWidth / 2)) {
                    x += svl.svImageWidth;
                }
                return x;
            });
            labelSvImageX = parseInt(svImageXs.mean(), 10) % svl.svImageWidth;
        } else {
            labelSvImageX = parseInt(svImageXs.mean(), 10);
        }
        heading = parseInt((labelSvImageX / svl.svImageWidth) * 360, 10) % 360;

        return {
            heading: parseInt(heading, 10),
            pitch: pitch,
            zoom: zoom
        };
    }

    /**
     * Return the deep copy of the properties object,
     * so the caller can only modify properties from
     * setProperties() (which I have not implemented.)
     * JavaScript Deepcopy
     * http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-a-javascript-object
     */
    function getProperties () { return $.extend(true, {}, properties); }

    /**
     * Get a property
     * @param propName
     * @returns {boolean}
     */
    function getProperty (propName) { return (propName in properties) ? properties[propName] : false; }

    /**
     * Get a status
     * @param key
     * @returns {*}
     */
    function getStatus (key) { return status[key]; }

    function getVisibility () { return status.visibility; }

    /**
     * This method changes the fill color of the path and points to orange.
     */
    function highlight () { return self.fill('rgba(255,165,0,0.8)'); }

    /**
     * Check if the label is deleted
     * @returns {boolean}
     */
    function isDeleted () { return status.deleted; }


    /**
     * Check if a path is under a cursor
     * @param x
     * @param y
     * @returns {boolean}
     */
    function isOn (x, y) {
        if (status.deleted || status.visibility === 'hidden') {  return false; }
        var result = path.isOn(x, y);
        return result ? result : false;
    }

    /**
     * This method returns the visibility of this label.
     * @returns {boolean}
     */
    function isVisible () { return status.visibility === 'visible'; }

    /**
     * Lock tag visibility
     * @returns {lockTagVisibility}
     */
    function lockTagVisibility () {
        lock.tagVisibility = true;
        return this;
    }

    /**
     * Lock visibility
     * @returns {lockVisibility}
     */
    function lockVisibility () {
        lock.visibility = true;
        return this;
    }

    /**
     * This method calculates the area overlap between this label and another label passed as an argument.
     * @param label
     * @param mode
     * @returns {*|number}
     */
    function overlap (label, mode) {
        if (!mode) {
            mode = "boundingbox";
        }

        if (mode !== "boundingbox") {
            throw self.className + ": " + mobede + " is not a valid option.";
        }
        var path1 = self.getPath(),
            path2 = label.getPath();

        return path1.overlap(path2, mode);
    }

    /**
     * Remove the label (it does not actually remove, but hides the label and set its status to 'deleted').
     */
    function remove () {
        setStatus('deleted', true);
        setStatus('visibility', 'hidden');
    }

    /**
     * This function removes the path and points in the path.
     */
    function removePath () {
        path.removePoints();
        path = undefined;
    }

    /**
     * This method renders this label on a canvas.
     * @param ctx
     * @param pov
     * @param evaluationMode
     * @returns {self}
     */
    function render (ctx, pov, evaluationMode) {
        if (!evaluationMode) {
            evaluationMode = false;
        }
        if (!status.deleted) {
            if (status.visibility === 'visible') {
                // Render a tag
                // Get a text to render (e.g, attribute type), and
                // canvas coordinate to render the tag.
                if(status.tagVisibility == 'visible') {
                    if (!evaluationMode) {
                        renderTag(ctx);
                        path.renderBoundingBox(ctx);
                        showDelete();
                        //showDelete(path);
                    }
                }

                // Render a path
                path.render2(ctx, pov);
            } else if (false) {
                // Render labels that are not in the current panorama but are close enough.
                // Get the label'svar latLng = toLatLng();
                var currLat = svl.panorama.location.latLng.lat(),
                    currLng = svl.panorama.location.latLng.lng();
                var d = svl.util.math.haversine(currLat, currLng, latLng.lat, latLng.lng);
                var offset = toOffset();

                if (d < properties.distanceThreshold) {
                    var dPosition = svl.util.math.latlngInverseOffset(currLat, currLat - latLng.lat, currLng - latLng.lng);

                    var dx = offset.dx - dPosition.dx;
                    var dy = offset.dy - dPosition.dy;
                    var dz = offset.dz;

                    var idx = svl.pointCloud.search(svl.panorama.pano, {x: dx, y: dy, z: dz});
                    var ix = idx / 3 % 512;
                    var iy = (idx / 3 - ix) / 512;
                    var imageCoordinateX = ix * 26;
                    var imageCoordinateY = 3328 - iy * 26;
                    var canvasPoint = svl.misc.imageCoordinateToCanvasCoordinate(imageCoordinateX, imageCoordinateY, pov);

                    console.log(canvasPoint);
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255,255,255,1)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(canvasPoint.x, canvasPoint.y, 10, 2 * Math.PI, 0, true);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fillStyle = path.getProperty('fillStyle'); // changeAlphaRGBA(properties.fillStyleInnerCircle, 0.5);
                    ctx.fill();
                    ctx.restore();

                    //new Point(tempPath[i].x, tempPath[i].y, pov, pointParameters)
                    //new Label(new Path(), params)
                }
            }
        }

        // Show a label on the google maps pane.
        if (!isDeleted()) {
            if (googleMarker && !googleMarker.map) {
                googleMarker.setMap(svl.map.getMap());
            }
        } else {
            if (googleMarker && googleMarker.map) {
                googleMarker.setMap(null);
            }
        }
        return this;
    }

    /**
     * This function renders a tag on a canvas to show a property of the label
     * @param ctx
     * @returns {boolean}
     */
    function renderTag(ctx) {
        if (arguments.length !== 3) {
            return false;
        }
        var boundingBox = path.getBoundingBox();
        var msg = properties.labelDescription;
        var messages = msg.split('\n');

        if (properties.labelerId !== 'DefaultValue') {
            messages.push('Labeler: ' + properties.labelerId);
        }

        ctx.font = '10.5pt Calibri';
        var height = properties.tagHeight * messages.length;
        var width = -1;
        for (var i = 0; i < messages.length; i += 1) {
            var w = ctx.measureText(messages[i]).width + 5;
            if (width < w) {
                width = w;
            }
        }
        properties.tagWidth = width;

        var tagX;
        var tagY;
        ctx.save();
        ctx.lineWidth = 3.5;
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = 'rgba(255,255,255,1)';
        ctx.beginPath();
        var connectorX = 15;
        if (connectorX > boundingBox.width) {
            connectorX = boundingBox.width - 1;
        }

        if (boundingBox.x < 5) {
            tagX = 5;
        } else {
            tagX = boundingBox.x;
        }

        if (boundingBox.y + boundingBox.height < 400) {
            ctx.moveTo(tagX + connectorX, boundingBox.y + boundingBox.height);
            ctx.lineTo(tagX + connectorX, boundingBox.y + boundingBox.height + 10);
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
            tagY = boundingBox.y + boundingBox.height + 10;
        } else {
            ctx.moveTo(tagX + connectorX, boundingBox.y);
            ctx.lineTo(tagX + connectorX, boundingBox.y - 10);
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
            // tagX = boundingBox.x;
            tagY = boundingBox.y - height - 20;
        }


        var r = 3;
        var paddingLeft = 16;
        var paddingRight = 30;
        var paddingBottom = 10;

        // Set rendering properties
        ctx.save();
        ctx.lineCap = 'square';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // point.getProperty('fillStyleInnerCircle');
        ctx.strokeStyle = 'rgba(255,255,255,1)'; // point.getProperty('strokeStyleOuterCircle');
        //point.getProperty('lineWidthOuterCircle');

        // Draw a tag
        ctx.beginPath();
        ctx.moveTo(tagX, tagY);
        ctx.lineTo(tagX + width + paddingLeft + paddingRight, tagY);
        ctx.lineTo(tagX + width + paddingLeft + paddingRight, tagY + height + paddingBottom);
        ctx.lineTo(tagX, tagY + height + paddingBottom);
        ctx.lineTo(tagX, tagY);
//        ctx.moveTo(tagX, tagY - r);
//        ctx.lineTo(tagX + width - r, tagY - r);
//        ctx.arc(tagX + width, tagY, r, 3 * Math.PI / 2, 0, false); // Corner
//        ctx.lineTo(tagX + width + r, tagY + height - r);
//        ctx.arc(tagX + width, tagY + height, r, 0, Math.PI / 2, false); // Corner
//        ctx.lineTo(tagX + r, tagY + height + r);
//        ctx.arc(tagX, tagY + height, r, Math.PI / 2, Math.PI, false); // Corner
//        ctx.lineTo(tagX - r, tagY); // Corner

        ctx.fill();
        ctx.stroke()
        ctx.closePath();
        ctx.restore();

        // Render an icon and a message
        ctx.save();
        ctx.fillStyle = '#000';
        var labelType = properties.labelType;
        var iconImagePath = getLabelIconImagePath()[labelType].iconImagePath;
        var imageObj;
        var imageHeight;
        var imageWidth;
        var imageX;
        var imageY;
        imageObj = new Image();
        imageHeight = imageWidth = 25;
        imageX =  tagX + 5;
        imageY = tagY + 2;

        //imageObj.onload = function () {

        ///            };
        // ctx.globalAlpha = 0.5;
        imageObj.src = iconImagePath;
        ctx.drawImage(imageObj, imageX, imageY, imageHeight, imageWidth);

        for (var i = 0; i < messages.length; i += 1) {
            ctx.fillText(messages[i], tagX + paddingLeft + 20, tagY + 20 + 20 * i);
        }
        // ctx.fillText(msg, tagX, tagY + 17);
        ctx.restore();

        return;
    }



    /**
     * This method turn the fill color of associated Path and Points into their original color.
     * @returns {resetFillStyle}
     */
    function resetFillStyle () {
        var path = self.getPath(),
            points = path.getPoints(),
            len = points.length;
        path.resetFillStyle();
        for (var i = 0; i < len; i++) {
            points[i].resetFillStyle();
        }
        return this;
    }

    /**
     * This function sets properties.tag.x and properties.tag.y to 0
     * @returns {resetTagCoordinate}
     */
    function resetTagCoordinate () {
        properties.tagX = 0;
        properties.tagY = 0;
        return this;
    }

    /**
     * This method changes the alpha channel of the fill color of the path and points that constitute the path.
     * @param alpha
     * @returns {setAlpha}
     */
    function setAlpha (alpha) {
        var path = self.getPath(),
            points = path.getPoints(),
            len = points.length,
            fillColor = path.getFillStyle();
        fillColor = svl.util.color.changeAlphaRGBA(fillColor, 0.3);

        path.setFillStyle(fillColor);
        for (var i = 0; i < len; i++) {
            points[i].setFillStyle(fillColor);
        }
        return this;
    }


    /**
     * This function sets the icon path of the point this label holds.
     * @param iconPath
     * @returns {*}
     */
    function setIconPath (iconPath) {
        if (path && path.points[0]) {
            var point = path.points[0];
            point.setIconPath(iconPath);
            return this;
        }
        return false;
    }

    /**
     * Set the labeler id
     * @param labelerIdIn
     * @returns {setLabelerId}
     */
    function setLabelerId (labelerIdIn) {
        properties.labelerId = labelerIdIn;
        return this;
    }

    /**
     * Sets a property
     * @param key
     * @param value
     * @returns {setProperty}
     */
    function setProperty (key, value) {
        properties[key] = value;
        return this;
    }

    /**
     * Set status
     * @param key
     * @param value
     */
    function setStatus (key, value) {
        if (key in status) {
            if (key === 'visibility' &&
                (value === 'visible' || value === 'hidden')) {
                // status[key] = value;
                self.setVisibility(value);
            } else if (key === 'tagVisibility' &&
                (value === 'visible' || value === 'hidden')) {
                self.setTagVisibility(value);
            } else if (key === 'deleted' && typeof value === 'boolean') {
                status[key] = value;
            }
        }
    }

    function setTagVisibility (visibility) {
        if (!lock.tagVisibility) {
            if (visibility === 'visible' || visibility === 'hidden') {
                status['tagVisibility'] = visibility;
            }
        }
        return this;
    }

    /**
     * This function sets the sub label type of this label. E.g. for a bus stop there are StopSign_OneLeg
     * @param labelType
     * @returns {setSubLabelDescription}
     */
    function setSubLabelDescription (labelType) {
        var labelDescriptions = getLabelDescriptions(),
            labelDescription = labelDescriptions[labelType].text;
        properties.labelProperties.subLabelDescription = labelDescription;
        return this;
    }

    /**
     * Set this label's visibility to the passed visibility
     * @param visibility
     * @param labelerIds
     * @param included
     * @returns {setVisibilityBasedOnLabelerId}
     */
    function setVisibilityBasedOnLabelerId (visibility, labelerIds, included) {
        if (included === undefined) {
            if (labelerIds.indexOf(properties.labelerId) !== -1) {
                self.unlockVisibility().setVisibility(visibility).lockVisibility();
            } else {
                visibility = visibility === 'visible' ? 'hidden' : 'visible';
                self.unlockVisibility().setVisibility(visibility).lockVisibility();
            }
        } else {
            if (included) {
                if (labelerIds.indexOf(properties.labelerId) !== -1) {
                    self.unlockVisibility().setVisibility(visibility).lockVisibility();
                }
            } else {
                if (labelerIds.indexOf(properties.labelerId) === -1) {
                    self.unlockVisibility().setVisibility(visibility).lockVisibility();
                }
            }
        }

        return this;
    }

    /**
     * Set the visibility of the label
     * @param visibility
     * @returns {setVisibility}
     */
    function setVisibility (visibility) {
        if (!lock.visibility) { status.visibility = visibility; }
        return this;
    }

    function setVisibilityBasedOnLocation (visibility, panoId) {
        if (!status.deleted) {
            if (panoId === properties.panoId) {
                // self.setStatus('visibility', visibility);
                self.setVisibility(visibility);
            } else {
                visibility = visibility === 'visible' ? 'hidden' : 'visible';
                // self.setStatus('visibility', visibility);
                self.setVisibility(visibility);
            }
        }
        return this;
    }

    /**
     *
     * @param visibility
     * @param tables
     * @param included
     */
    function setVisibilityBasedOnLabelerIdAndLabelTypes (visibility, tables, included) {
        var tablesLen = tables.length, matched = false;

        for (var i = 0; i < tablesLen; i += 1) {
            if (tables[i].userIds.indexOf(properties.labelerId) !== -1) {
                if (tables[i].labelTypesToRender.indexOf(properties.labelProperties.labelType) !== -1) {
                    matched = true;
                }
            }
        }
        if (included === undefined) {
            if (matched) {
                self.unlockVisibility().setVisibility(visibility).lockVisibility();
            } else {
                visibility = visibility === 'visible' ? 'hidden' : 'visible';
                self.unlockVisibility().setVisibility(visibility).lockVisibility();
            }
        } else {
            if (included) {
                if (matched) {
                    self.unlockVisibility().setVisibility(visibility).lockVisibility();
                }
            } else {
                if (!matched) {
                    self.unlockVisibility().setVisibility(visibility).lockVisibility();
                }
            }
        }
    }

    /**
     * Show the delete button
     */
    function showDelete() {
        if (status.tagVisibility !== 'hidden') {
            var boundingBox = path.getBoundingBox(),
                x = boundingBox.x + boundingBox.width - 20,
                y = boundingBox.y;

            // Show a delete button
            var $divHolderLabelDeleteIcon = $("#Holder_LabelDeleteIcon");
            $divHolderLabelDeleteIcon.css({
                visibility: 'visible',
                left : x, // + width - 5,
                top : y
            });
        }
    }

    function toOffset() {
        var imageCoordinates = path.getImageCoordinates();
        var lat = properties.panoramaLat;
        var pc = svl.pointCloud.getPointCloud(properties.panoId);
        if (pc) {
            var minDx = 1000;
            var minDy = 1000;
            var minDz = 1000;
            for (var i = 0; i < imageCoordinates.length; i++) {
                var p = svl.util.scaleImageCoordinate(imageCoordinates[i].x, imageCoordinates[i].y, 1 / 26);
                var idx = 3 * (Math.ceil(p.x) + 512 * Math.ceil(p.y));
                var dx = pc.pointCloud[idx];
                var dy = pc.pointCloud[idx + 1];
                var dz = pc.pointCloud[idx + 2];
                var r = dx * dx + dy * dy;
                var minR = minDx * minDx + minDy + minDy;

                if (r < minR) {
                    minDx = dx;
                    minDy = dy;
                    minDz = dz;
                }
            }
            return {dx: minDx, dy: minDy, dz: minDz};
        }
    }

    /**
     * Get the label latlng position
     * @returns {lat: labelLat, lng: labelLng}
     */
    function toLatLng() {
        if (!properties.labelLat) {
            var imageCoordinates = path.getImageCoordinates();
            var lat = properties.panoramaLat;
            var pc = svl.pointCloud.getPointCloud(properties.panoId);
            if (pc) {
                var minDx = 1000;
                var minDy = 1000;
                var delta;
                for (var i = 0; i < imageCoordinates.length; i ++) {
                    var p = svl.util.scaleImageCoordinate(imageCoordinates[i].x, imageCoordinates[i].y, 1/26);
                    var idx = 3 * (Math.ceil(p.x) + 512 * Math.ceil(p.y));
                    var dx = pc.pointCloud[idx];
                    var dy = pc.pointCloud[idx + 1];
                    var r = dx * dx + dy * dy;
                    var minR = minDx * minDx + minDy + minDy;

                    if ( r < minR) {
                        minDx = dx;
                        minDy = dy;

                    }
                }
                delta = svl.util.math.latlngOffset(properties.panoramaLat, dx, dy);
                var latlng = {lat: properties.panoramaLat + delta.dlat, lng: properties.panoramaLng + delta.dlng};
                setProperty('labelLat', latlng.lat);
                setProperty('labelLng', latlng.lng);
                return latlng;
            } else {
                return null;
            }
        } else {
            return { lat: getProperty('labelLat'), lng: getProperty('labelLng') };
        }

    }

    function unlockVisibility () {
        lock.visibility = false;
        return this;
    }

    function unlockTagVisibility () {
        lock.tagVisibility = false;
        return this;
    }


    self.resetFillStyle = resetFillStyle;
    self.blink = blink;
    self.fadeFillStyle = fadeFillStyle;
    self.getBoundingBox = getBoundingBox;
    self.getCoordinate = getCoordinate;
    self.getGSVImageCoordinate = getGSVImageCoordinate;
    self.getImageCoordinates = getImageCoordinates;
    self.getLabelId = getLabelId;
    self.getLabelType = getLabelType;
    self.getPath = getPath;
    self.getPoint = getPoint;
    self.getPoints = getPoints;
    self.getLabelPov = getLabelPov;
    self.getProperties = getProperties;
    self.getProperty = getProperty;
    self.getstatus = getStatus;
    self.getVisibility = getVisibility;
    self.fill = fill;
    self.isDeleted = isDeleted;
    self.isOn = isOn;
    self.isVisible = isVisible;
    self.highlight = highlight;
    self.lockTagVisibility = lockTagVisibility;
    self.lockVisibility = lockVisibility;
    self.overlap = overlap;
    self.removePath = removePath;
    self.render = render;
    self.remove = remove;
    self.resetTagCoordinate = resetTagCoordinate;
    self.setAlpha = setAlpha;
    self.setIconPath = setIconPath;
    self.setLabelerId = setLabelerId;
    self.setStatus = setStatus;
    self.setTagVisibility = setTagVisibility;
    self.setSubLabelDescription = setSubLabelDescription;
    self.setVisibility = setVisibility;
    self.setVisibilityBasedOnLocation = setVisibilityBasedOnLocation;
    self.setVisibilityBasedOnLabelerId = setVisibilityBasedOnLabelerId;
    self.setVisibilityBasedOnLabelerIdAndLabelTypes = setVisibilityBasedOnLabelerIdAndLabelTypes;
    self.unlockTagVisibility = unlockTagVisibility;
    self.unlockVisibility = unlockVisibility;
    self.toLatLng = toLatLng;

    if (!init(params, pathIn)) {
        return false;
    }
    return self;
}
