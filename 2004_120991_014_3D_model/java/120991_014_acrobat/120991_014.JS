// Copyright 2005 Kaon Interactive Inc. Annotation-Level JavaScript
// This JavaScript file and corresponding U3D binary file have been created with Kaon U3D Exporter v. 2.707.4 at Thu Oct 17 13:11:49 CDT 2013
// Texture Images Compression Log
// texture_1_1.jpg (2048x2048)  has been JPEG compressed with 80%. Size = 321192
    var PRODUCT_TITLE = "MASTER";
    var EXPORTER_VERSION = '2.707.4';
    var __DEFAULT_BGR_COLOR_R__ = 0.0;
    var __DEFAULT_BGR_COLOR_G__ = 0.0;
    var __DEFAULT_BGR_COLOR_B__ = 0.0;
    var MSG_MEASURE_IN_INCHES = 'Measure in Inches';
    var MSG_MEASURE_IN_CENTIMETERS = 'Measure in Centimeters';
    var MSG_CLICK_AND_DRAG_TO_MEASURE = 'Click and Drag to Measure';
    var MSG_HOTSPOTS = 'Hotspots';
    var MSG_RESET = 'Reset';
/***************************************/
/*        C O N T R O L                */
/***************************************/
var CONTROL = new Array();

function Control()
{
}

function getControlID( ident )
{
    for( var obj in CONTROL )
    {
        var object = CONTROL[obj];
        var a = object._class+"."+object.section;
        if ( ident==a ) return obj;
    }
    return null;
}

function getAppControlDescriptionField( name )
{
    for( obj in CONTROL )
    {
        var object = CONTROL[obj];
        if ( object._class=="AppControlDescription" )
        {
            var fieldName = "object."+name;
            var fieldValue = eval(fieldName);
            if ( fieldValue==undefined ) return null;
            return fieldValue;
        }
    }
    return null;
}


/***************************************/
/*           E H L                     */
/***************************************/

var EHLs = new Array();

function EHL(
    parent,     // String
    id,         // String
    target, // String
    sourceWeight,   // Float
    targetWeight,      // Float
    segmentsCount, // Int
    radius, // Float
    flatten, // Float
    hasExtension, // Boolean
    length   // Array of Float
    )
{
    this.parent = parent;
    this.id = id;
    this.target = target,
    this.sourceWeight = sourceWeight;
    this.targetWeight = targetWeight;
    this.segmentsCount = segmentsCount
    this.radius = radius;
    this.flatten = flatten;
    this.hasExtension = hasExtension;
    this.length = length;
    this.totalLength = 0;
    for( var j=0; j<length.length; j++)
        this.totalLength += length[j];
    this.lastTransform = new Matrix4x4();

}

EHL.prototype.update = function()
{
    var currentLength = 0;
    var targetMatrix = getWorldMatrix(this.target);
    var myMatrix = getWorldMatrix(this.id);
    myMatrix.invertInPlace();
    targetMatrix.multiplyInPlace(myMatrix);
    var transform = targetMatrix;
    if ( transform.isEqual(this.lastTransform) ) return; // Relative positions of source and target are not changed, don't recalculate EHL
    this.lastTransform.set(transform);
    var p1 = new Vector3(); // (0,0,0)
    var r1= new Vector3(0,0,-1);
    r1.scaleInPlace( this.sourceWeight );
    var p4 = transform.transformPosition(new Vector3());
    var r4 = transform.transformDirection(new Vector3(0,0,-1));
    r4.scaleInPlace( this.targetWeight );
    var nextPos = new Vector3();
    var initialOrientation = new Vector3(0,0,-1);
    var currentPos = new Vector3(); // EHL always starts at (0,0,0) local coordinates
    var currentOrientation = new Vector3();
    var lastSegmentTransform = new Matrix4x4();
    if ( this.flatten != 1.0 || this.hasExtension )
    {
        var psiSource = 0;
        var ordX = new Vector3(1,0,0);
        var targetOrdX = transform.transformDirection(ordX);
        var ordZ = new Vector3(0,0,-1);
        var targetOrdZ = transform.transformDirection(ordZ);
        targetOrdZ.normalize();
        currentOrientation.set( targetOrdZ );
        var crossNormal = initialOrientation.cross(currentOrientation);
        var dot = currentOrientation.dot(initialOrientation);
        var angle = Math.acos(dot);
        transform.setIdentity();
        transform.rotateAboutVectorInPlace( angle, crossNormal );
        var ordX = transform.transformDirection(ordX);
        var ordY = transform.transformDirection(new Vector3(0,1,0));
        var psiTarget = Math.atan2( targetOrdX.dot(ordY), targetOrdX.dot(ordX) );
        while( psiTarget>Math.PI/2 || psiTarget<-Math.PI/2 )
        {
            if ( psiTarget>Math.PI/2 ) psiTarget = psiTarget-Math.PI;
            if ( psiTarget<-Math.PI/2 ) psiTarget = psiTarget+Math.PI;
        }
    }
    for( var j=1; j<=this.segmentsCount; j++)
    {
        var t = j/this.segmentsCount;
        var t2 = t*t;
        var t3 = t2*t;
        nextPos.set(p1);
        nextPos.scaleInPlace( 2*t3-3*t2+1 );
        nextPos.addScaledInPlace( p4, -2*t3+3*t2 );
        nextPos.addScaledInPlace( r1, t3-2*t2+t );
        nextPos.addScaledInPlace( r4, t3-t2 );
        var dist = (nextPos.subtract(currentPos)).length;
        var scale = dist/this.length[j-1];

        currentOrientation.set( nextPos );
        currentOrientation.subtractInPlace(currentPos);
        var crossNormal = initialOrientation.cross(currentOrientation);
        var dot = currentOrientation.dot(initialOrientation);
        var angle = Math.acos(dot/currentOrientation.length);
        transform.setIdentity();
        transform.scaleInPlace( 1, 1, scale );

// Twist
        if ( this.flatten != 1.0 || this.hasExtension )
        {
            currentLength += this.length[j-1];
            var psi = psiSource + currentLength/this.totalLength*(psiTarget-psiSource);
            transform.rotateAboutZInPlace(psi);
        }
        transform.rotateAboutVectorInPlace( angle, crossNormal );
        transform.translateInPlace(currentPos);

        if (false) // Feature disabled
            if ( this.flatten == 1.0 && !this.hasExtension && j>1 )
            {   // Correction twist to minimize texture distortion
                var ordX = new Vector3(1,0,0);
                var prevOrdX = lastSegmentTransform.transformDirection( ordX );
                var currOrdX = transform.transformDirection( ordX );
                var corrAngle = Math.acos( currOrdX.dot(prevOrdX) );
                if ( angle>Math.PI/90 ) // Two degrees
                { // Recalculate transform matrix
                    transform.setIdentity();
                    transform.scaleInPlace( 1, 1, scale );
                    transform.rotateAboutZInPlace(-corrAngle);
                    transform.rotateAboutVectorInPlace( angle, crossNormal );
                    transform.translateInPlace(currentPos);
                }
            }
        node = scene.nodes.getByName( this.id+"#"+(j-1) );
        if ( node!=undefined )
            node.transform.set(transform);
        currentPos.set(nextPos);
        lastSegmentTransform.set(transform);
    }
}

function getWorldMatrix( id )
{
    var node = scene.nodes.getByName(id);
    var parentID = OBJECT[id].parent;
    var transform = new Matrix4x4();
    transform.set(node.transform);
    while(parentID!="ROOT" && parentID!="__SCENE__")
    {
        node = scene.nodes.getByName(parentID);
        transform.multiplyInPlace(node.transform);
        parentID = OBJECT[parentID].parent;
    }
    return transform;
}

function updateEHLs()
{
    for( var ehl in EHLs )
        EHLs[ehl].update();
}

/***************************************/
/*       H O T S P O T                 */
/***************************************/
var HOTSPOTS_PERMANENT_VISIBILITY = true;
var HOTSPOTS_TEMPORARY_VISIBILITY = true;
var HOTSPOT = new Array();
var MASTER_OF = new Array();
var HOTSPOT_COUNT = 0;
var HOTSPOT_SCALE = 0.75;

// This constructor IS NOT USED anymore
function Hotspot(
    id, // String
    actionID, // String
    scriptID, // String
    x, // Float
    y, // Float
    z, // Float
    radius, // Float
    objectID,  // String
    mouseOver, // boolean
    text   // String
    )
{
    this.id = id;
    this.actionID = actionID;
    this.scriptID = scriptID;
    this.x = x;
    this.y = y;
    this.z = z;
    this.radius = radius;
    this.object = objectID;
    this.mouseOver = mouseOver;
    this.text = text;
    this.active = true;
    this.index = HOTSPOT_COUNT;
    HOTSPOT_COUNT++;
}

function setActiveHotspots( objectID, visible )
{
    for( var j=0; j<HOTSPOT.length; j++)
        if ( HOTSPOT[j].objectID == objectID ) HOTSPOT[j].active = visible;
}

function setHotspotsTemporaryVisibility( on )
{
    var obj;
    HOTSPOTS_TEMPORARY_VISIBILITY = on;
    for( obj in MASTER_OF )
    {
        OBJECT[obj].setVisible( HOTSPOTS_PERMANENT_VISIBILITY && on);
    }
    for( obj in HOTSPOT )
    {
        var hs = HOTSPOT[obj];
        if ( hs.visibleVar!=undefined && hs.visibleVar!=null )
        { // This is a conditional hotspot, visibility is controlled by the status of a variable
            OBJECT[obj].setVisible(GLOBAL_VAR[hs.visibleVar]==hs.visibleValue && OBJECT[hs.object].isVisible() );
            continue;
        }
        var scriptIsReady = true;
        if ( on && HOTSPOT[obj].script!=null )
        {
            scriptIsReady = isReadyToPlay(HOTSPOT[obj].script);
            if ( !scriptIsReady )
            {
                for( phantom in MASTER_OF )
                {
                    if ( MASTER_OF[phantom]==obj )
                        OBJECT[phantom].setVisible( false );
                }
            }
        }
        if ( HOTSPOT[obj].mouseOver=="true" )
        {
            OBJECT[obj].setVisible( HOTSPOTS_PERMANENT_VISIBILITY && on && scriptIsReady && OBJECT[HOTSPOT[obj].object].isVisible());
        }
    }
}

function setHotspotsPermanentVisibility( on )
{
    HOTSPOTS_PERMANENT_VISIBILITY = on;
    for( var obj in HOTSPOT )
    {
        if ( HOTSPOT[obj].mouseOver=="true" )
            OBJECT[obj].setVisible( HOTSPOTS_TEMPORARY_VISIBILITY && on);
    }
    for( var obj in MASTER_OF )
    {
        OBJECT[obj].setVisible( HOTSPOTS_TEMPORARY_VISIBILITY && on);
    }
}

function setBlinkingHotSpot( hotSpotObjectID )
{
    if ( blinkingHotspot!=null && blinkingHotspot!=hotSpotObjectID)
    {
        var on = HOTSPOT[blinkingHotspot].mouseOver=="true";
        OBJECT[blinkingHotspot].setVisible( on );
    }
    if ( hotSpotObjectID!=null )
    {
        blinkerTime = CURRENT_TIME;
        OBJECT[hotSpotObjectID].setVisible(false);
    }
    blinkingHotspot = hotSpotObjectID;
}

function activateHotspot( name, value )
{
    var condition = name+"="+value;
    for( var h in HOTSPOT )
    {
        var hs = HOTSPOT[h];
        if ( hs.visibleVar!=undefined && hs.visibleVar!=null && hs.visibleVar==name)
        {
            var master = MASTER_OF[h];
            if ( master!=undefined ) // If this is an invisible phantom of the hotspot
                OBJECT[master].setVisible(hs.visibleValue==value);
            else
                OBJECT[h].setVisible(hs.visibleValue==value);
        }
        for( var j=0; j<hs.force.length; j++)
        {
            if ( h==blinkingHotspot && hs.force[j].indexOf(name+"=")==0 )
            {
                setBlinkingHotSpot( null );
                deleteAnnotation();
            }
            if ( hs.force[j]==condition )
            {
                setBlinkingHotSpot( h );
                showAnnotation( hs.index, h, hs.text, hs.richText, hs.script, -1, -1 );
            }
        }
    }
}

function getSpanCount( id )
{
    var object = findObject(id);
    if ( object != null )
        return object.richText.length;
    else
        return 0;
}

function getSpanTagCount( id, j )
{
    var object = findObject(id);
    if ( object!=null )
        return object.richText[j].tags.length;
    else
        return 0;
}

function getSpanText(  id, j )
{
    var object = findObject(id);
    if ( object!=null )
    {
        return CURRENT_STRING = object.richText[j].text;
    }
    else
        return "";
}

function getSpanTag(  id, j, k )
{
    var object = findObject(id);
    if ( object!=null )
        return object.richText[j].tags[k];
    else
        return "";
}

function findObject( id )
{
    if ( HOTSPOT[id] != undefined )
        return HOTSPOT[id];
    if ( CONTROL[id] != undefined )
        return CONTROL[id];
    return null;
}

function isScriptedHotspot( id )
{
    return HOTSPOT[id]!=undefined && HOTSPOT[id].mouseOver!="true";
}

function setVisibleHotspotScale( scale )
{
    for( var h in HOTSPOT )
    {
        OBJECT[h].scale =  scale;
        var node = scene.nodes.getByName( OBJECT[h].id );
        if ( node!=undefined && node.visible )
            OBJECT[h].apply(null,null,null,null,null);
    }
}

var lastScale = -1;
function setDynamicHotspotSize()
{
    var camera = scene.cameras.getByIndex(0);
    var dx = camera.position.x - camera.targetPosition.x;
    var dy = camera.position.z - camera.targetPosition.z;
    var dz = camera.position.y - camera.targetPosition.y;
    this.dist = Math.sqrt( dx*dx + dy*dy + dz*dz );
    this.fov = camera.fov;
    var width =  dist*Math.tan(fov/2);
    var radius = width*HOTSPOT_VISIBLE_RADIUS/100.0;
    var scale = radius/HOTSPOT_INITIAL_RADIUS;
    scale = HOTSPOT_SCALE*Math.pow(scale,HOTSPOT_RESCALING_POWER);
    if ( scale==lastScale ) return;
    setVisibleHotspotScale( scale );
    lastScale = scale;
}

/***************************************/
/*            M O U S E                */
/***************************************/

runtime.scrollWheelSpeed = 0; // Disable zooming by mouse scroll wheel in Reader 8.1

var CUSTOM_NAVIGATION = true;
var mouseHandler = new MouseEventHandler();
mouseHandler.onMouseUp = true;
mouseHandler.onMouseDown = true;
mouseHandler.onMouseMove = true;
mouseHandler.scriptStarted = false;

//mouseHandler.onMouseHit = false;
//mouseHandler.onMouseOut = false;
//mouseHandler.onMouseOver = false;
//mouseHandler.reportAllTargets = false;

var mouseStartDragX, mouseStartDragY;
var lastDX = 0;
var lastDY = 0;
var startDragView = new View();
var lastDragTime = 0;
var isMovingMode = false;

mouseHandler.onEvent = function( event )
{
    if ( event.isMouseDown )
    {
        MOUSE_DOWN = true;
        MOUSE_UP = false;
        if ( CUSTOM_NAVIGATION )
        {
            mouseStartDragX = event.mouseX;
            mouseStartDragY = event.mouseY;
            startDragView.getCameraPosition();
            runtime.overrideNavTools = CUSTOM_NAVIGATION;
        }
        mouseHandler.scriptStarted = false;
        deleteAnnotation();
        if ( event.hits.length>0 )
        {
            var objectID = event.hits[0].target.name;
            var master = MASTER_OF[objectID];
            if ( master!=undefined ) // If this is an invisible phantom of the hotspot
                objectID = master; // delegate handling to the hotspot itself
            hotSpot = HOTSPOT[objectID];
            if ( hotSpot!=undefined && hotSpot.script!=null )
            {
                mouseHandler.scriptStarted = true;
                startScript( hotSpot.script );
            }
            else
            if ( hotSpot!=undefined && hotSpot.action!=null )
            { // hotSpot.action can contain an arbitrary JavaScript code to run when hotspot is clicked
              // For now this field is always null.
                eval( hotSpot.action );
            }
            else
                setHotspotsTemporaryVisibility( false );
        }
        else
            setHotspotsTemporaryVisibility( false );
        for( var j=0; j<OBJECT2D.length; j++)
            if ( j!=1 ) // Don't make invisible measuring cursor
                OBJECT2D[j].setVisible( false );
        if ( MEASURE_MODE )
        {
              startMeasuring( event );
        }
        GOAL_VIEW = null;
        isMovingMode = false;
    }
    if ( event.isMouseMove )
    {
        if ( event.hits.length>0 )
        {
            var objectID = event.hits[0].target.name;
            var master = MASTER_OF[objectID];
            if ( master!=undefined ) // If this is an invisible phantom of the hotspot
                objectID = master; // delegate handling to the hotspot itself
            hotSpot = HOTSPOT[objectID];
            if ( hotSpot!=undefined )
            {
                found = false;
                for( var j=1; j<event.hits.length; j++)
                {
                    var targetName = event.hits[j].target.name;
                    if ( targetName==objectID ) continue; // Ignore hotspot itself
                    var ind = targetName.lastIndexOf("#");
                    if ( ind!=-1 ) targetName = targetName.substring(0,ind);
                    if ( targetName==hotSpot.object || targetName==hotSpot.object+"_mesh" )
                        found = true;
                    else
                        if ( targetName.indexOf("_swap")!=-1 ) // If this is a swap object
                        {                                      // consider its parent instead
                            targetName = OBJECT[targetName].parent;
                            if ( targetName==hotSpot.object )
                                found = true;
                        }
                    break;
                }
                if ( found && objectID!=blinkingHotspot )
                {
                    setBlinkingHotSpot( objectID );
                    showAnnotation( hotSpot.index, objectID, hotSpot.text, hotSpot.richText, hotSpot.script, event.mouseX, event.mouseY );
                }
            }
            else
                if ( !HOTSPOT_KEEP_POPUP )
                {
                    setBlinkingHotSpot( null );
                    deleteAnnotation();
                }
            if ( MEASURE_MODE && event.leftButtonDown )
            {
                if ( MEASURE_ORIGIN==null )
                {
                    startMeasuring( event );
                }
                if ( MEASURE_TARGET==null )
                    MEASURE_TARGET = new Vector3( event.hits[0].position.x, event.hits[0].position.y, event.hits[0].position.z );
                else
                    MEASURE_TARGET.set( event.hits[0].position );
                setObject2D( 1 , event );
            }
        }
        else
            if ( !HOTSPOT_KEEP_POPUP )
            {
                setBlinkingHotSpot( null );
                deleteAnnotation();
            }
        if ( CUSTOM_NAVIGATION && !MEASURE_MODE && (event.leftButtonDown || event.rightButtonDown))
        {
            var now = CURRENT_TIME;
            if ( now!=lastDragTime )
            {
                var dx = event.mouseX - mouseStartDragX;
                var dy = event.mouseY - mouseStartDragY;
                var both = (event.leftButtonDown && event.rightButtonDown);
                if ( dx!=lastDX || dy!=lastDY )
                {
                    if ( ROTATE_MODE && event.leftButtonDown && !event.rightButtonDown  && !isMovingMode )
                    {
                        rotateViewByMouse( dx/CANVAS_WIDTH, dy/CANVAS_HEIGHT );
                    }
                    else
                    if ( ( MOVE_MODE && (event.leftButtonDown || both) ) || ( ROTATE_MODE && both) )
                    {
                         moveViewByMouse( dx/CANVAS_WIDTH, dy/CANVAS_HEIGHT );
                         isMovingMode = true; // To prevent accidental zooming when left button is released prematurely
                    }
                    else
                        if ( event.rightButtonDown && !isMovingMode )
                        { // Zoom in/out regardless of mode
                            zoomViewByMouse( dy/CANVAS_HEIGHT );
                            setDynamicHotspotSize();
                        }
                    lastDX = dx;
                    lastDY = dy;
                }
                lastDragTime = now;
            }
        }
    }
    if ( event.isMouseUp )
    {
        MOUSE_UP = true;
        if ( !MEASURE_MODE && !mouseHandler.scriptStarted )
        {
            setDynamicHotspotSize();
            setHotspotsTemporaryVisibility( true );
        }
        if ( MEASURE_MODE )
        {
            if ( event.hits.length>0 )
            {
                setObject2D(1, event );
                MEASURE_TARGET.set( event.hits[0].position );
            }
            if ( MEASURE_ORIGIN==null || MEASURE_TARGET==null )
                CURRENT_MEASUREMENT = "N/A";
            else
                CURRENT_MEASUREMENT = distance( MEASURE_ORIGIN, MEASURE_TARGET );
            MEASURE_ORIGIN = null;
            MEASURE_TARGET = null;
        }
        for( var j=0; j<OBJECT2D.length; j++)
            if ( OBJECT2D[j].isActive() )
            {
    	        OBJECT2D[j].setPosition( event.distance )
                OBJECT2D[j].setVisible( true );
            }
    }
}

function startMeasuring( event )
{
    if ( MEASURE_ORIGIN!=null ) return;
    OBJECT2D[0].setActive(false);
    OBJECT2D[1].setActive(false);
    if ( MEASURE_ORIGIN==null && event.hits!=null && event.hits.length>0 )
    {
        MEASURE_ORIGIN = new Vector3( event.hits[0].position.x, event.hits[0].position.y, event.hits[0].position.z );
        setObject2D(0, event );
        MEASURE_TARGET = null;
    }
}

function distance( pos0, pos1 )
{
    var dx = pos0.x-pos1.x;
    var dy = pos0.y-pos1.y;
    var dz = pos0.z-pos1.z;
    var dist = Math.sqrt( dx*dx + dy*dy + dz*dz );
    dist *= MILLIMETER;
    return dist;
}

function setObject2D( n, event )
{
    OBJECT2D[n].setLocation( event.mouseX, event.mouseY, 1 );
    OBJECT2D[n].setActive(true);
    OBJECT2D[n].setPosition( event.hits[0].distance );
    OBJECT2D[n].setVisible(true);
}

runtime.addEventHandler( mouseHandler );
/***************************************/
/*           O B J                     */
/***************************************/
var OBJECT = new Array();
var OBJECT_MATERIALS = new Array();
var SMOOTH_FADING = false;
var SMOOTH_FADING_MATERIALS_LIMIT = 8;

function Obj(
    parent,     // String
    id,         // String
    alphaObject, // String
    position,   // Vector3
    pivot,      // Vector3
    orientation // Vector3
    )
{
    this.parent = parent;
    this.id = id;
    this.alphaObject = alphaObject,
    this.position = position;
    this.pivot = pivot;
    this.orientation = orientation;
    this.alpha = 1.0;
    this.selected = -1;
    this.scale = 1.0;
}

Obj.prototype.setVisible = function( visible )
{
    var obj;
    var node = scene.nodes.getByName( this.id )
    if ( node==undefined ) return;
    node.visible = visible;
    this.alpha = (visible?1:0);
    if ( !visible && blinkingHotspot==this.id )
        blinkingHotspot = null;
    for( obj in OBJECT )
    {
        if ( OBJECT[obj].alphaObject==this.id && !isScriptedHotspot(obj) )
        {
            if ( visible && HOTSPOT[obj]!=undefined && _RUNNING_!=null ) // Don't make attached to the object hotspot visible while running a script
                continue;
            node = scene.nodes.getByName( obj );
            if ( node==undefined ) continue;
            node.visible = visible;
            OBJECT[obj].alpha = (visible?1:0);
        }
    }
}

Obj.prototype.isVisible = function()
{
    var node = scene.nodes.getByName( this.id )
    if ( node==undefined ) return false;
    return node.visible;
}

Obj.prototype.setHitEnabled = function( enable )
{
    var node = scene.nodes.getByName( this.id )
    if ( node==undefined ) return;
    node.hitEnabled = enable;
}

Obj.prototype.apply = function( position, pivot, orientation, quaternion, alpha )
{
    if ( position == null )
        position = this.position;
    if ( pivot == null )
        pivot = this.pivot;
    if ( orientation == null && quaternion == null )
        orientation = this.orientation;
    var transform = new Matrix4x4();

    var node = scene.nodes.getByName( this.id )
    if ( node==undefined ) return;

    matrix = new Matrix4x4(); // Identity
    if ( this.scale!=1.0 )
        matrix.scaleInPlace( this.scale, this.scale, this.scale );
    if ( pivot != null )
    {
        pivot.x = -pivot.x;
        pivot.y = -pivot.y;
        pivot.z = -pivot.z;
        matrix.translateInPlace( pivot );
    }
    if (orientation != null )
        rotateWithAngles( matrix, orientation );
    if (quaternion != null ) // orientation and quaternion should never be non-null altogether
        matrix.rotateWithQuaternionInPlace( quaternion );
    if ( pivot != null )
    {
        pivot.x = -pivot.x;
        pivot.y = -pivot.y;
        pivot.z = -pivot.z;
        matrix.translateInPlace( pivot );
    }
    if ( position != null )
        matrix.translateInPlace( position );
    node.transform.set(matrix);

    if ( alpha!=null )
    {
        this.applyAlpha( alpha );
    }

    this.position = position;
    this.pivot = pivot;
    this.orientation = orientation;
}

Obj.prototype.applyAlpha = function( alpha )
{
    var node = scene.nodes.getByName( this.id )
    if ( node==undefined ) return;
    if ( alpha==null ) return;
    for( var obj in OBJECT )
    {
        var object = OBJECT[obj];
        if ( (obj==this.id || object.alphaObject==this.id) && !isScriptedHotspot(obj) )
        {
            if ( alpha>0 && HOTSPOT[obj]!=undefined && _RUNNING_!=null ) // Don't make hotspot visible while running a script
                continue;
            var node = scene.nodes.getByName( obj );
            if ( node==undefined ) continue;
            if ( object.selected>=0 ) // swap object
            {
                object.alpha = alpha*object.selected;
            }
            else
            {
                object.alpha = alpha;
            }
            var alphaSet = false;
            if ( SMOOTH_FADING && OBJECT_MATERIALS!=undefined )
                alphaSet = setMaterialsAlpha( obj, node, object.alpha );
            if ( !alphaSet )
                setVisibility( node, object.alpha );
            object.alpha = alpha;
        }
    }
}

function setMaterialsAlpha( obj, node, alpha )
{
    if ( alpha == 0.0 )
        node.visible = false;
    else
        node.visible = true;
    var materials = OBJECT_MATERIALS[obj];
    if ( materials!=undefined )
    {
        if ( materials.length >=SMOOTH_FADING_MATERIALS_LIMIT ) return false; // setOpacity() method is too "heavy" to apply it to multi-material objects
        for( var m in  materials )
            if ( MATERIAL[materials[m]].hasAlphaChannel )
                return false;
        for( var m in  materials )
            MATERIAL[materials[m]].setOpacity( alpha );
        return true;
    }
    return false;
}

function setVisibility( node, alpha )
{
    if ( alpha <= 0.0 ) // Hide
    {
        node.visible = false;
    }
    else
    if ( alpha >= 1.0 ) // Show
    {
        node.visible = true;
        node.renderMode = "solid";
    }
    else                // Make transparent
    {
        node.visible = true;
        node.renderMode = "transparent";
    }
}

Obj.prototype.rotate = function( theta, phi, psi )
{
    this.apply( null, null, new Vector3( theta, phi, psi), null, null );
}

Obj.prototype.translate = function( x, y, z )
{
    this.apply( new Vector3( x, y, z ), null, null, null, null );
}

function rotateWithAngles( matrix, orientation )
{
    matrix.rotateAboutZInPlace( orientation.z*DEG_TO_RAD ); // Psi
    matrix.rotateAboutXInPlace( -orientation.y*DEG_TO_RAD ); // Phi
    matrix.rotateAboutYInPlace( -orientation.x*DEG_TO_RAD ); // Theta
}

/***************************************/
/*           O B J E C T 2 D           */
/***************************************/

function Object2D(
    objID,     // String
    image,         // String
    action,
    objectWidth,
    objectHeight,
    width,   // int
    height,   // int
    isArrow,
    isPointer
    )
{
    this.objID = objID;
    this.image = image;
    this.action = action;
    this.objectWidth = objectWidth;
    this.objectHeight = objectHeight;
    this.width = width;
    this.height = height;
    this.isArrow = isArrow;
    this.isPointer = isPointer;
    this.active = false;
    this.locationSet = false;
}

Object2D.prototype.setActive = function( active )
{
    this.active = active;
}

Object2D.prototype.isActive = function()
{
    return this.active;
}

Object2D.prototype.isLocationSet = function()
{
    return this.locationSet;
}

Object2D.prototype.setVisible = function( visible )
{
    if ( this.active )
        OBJECT[this.objID].setVisible( visible );
    if ( this.isPointer )
        this.setHitEnabled( false );
}

Object2D.prototype.setVisibleUncond = function( visible )
{
    OBJECT[this.objID].setVisible( visible );
}

Object2D.prototype.setHitEnabled = function( enable )
{
    OBJECT[this.objID].setHitEnabled( enable );
}

Object2D.prototype.setLocation = function( x0, y0, scale )
{
    this.locationSet = true;
    this.x0 = x0;
    this.y0 = y0;
    this.scale = scale;
    if ( this.isArrow || this.isPointer)
    {
        this.centerX = x0;
        this.centerY = y0;
    }
    else
    {
        this.centerX = x0 + this.width*scale/2.0;
        this.centerY = y0 + this.height*scale/2.0;
    }
}

Object2D.prototype.setPosition = function( distanceToSurface )
{
    var camera = scene.cameras.getByIndex(0);
    var dir = camera.getDirectionFromScreen( this.centerX, this.centerY, CANVAS_WIDTH, CANVAS_HEIGHT );
    var target = new Vector3( camera.targetPosition.x, camera.targetPosition.y, camera.targetPosition.z );
    target.subtractInPlace( camera.position );
    var dist = target.length;
    var unitsPerHeight = 2*dist*Math.tan( camera.fov/2 );
    var unitsPerPixel = unitsPerHeight/CANVAS_HEIGHT;
    var imageHeightInUnits = this.height*this.scale*unitsPerPixel;
    var distToCamera = dist*this.objectHeight/imageHeightInUnits;
    if ( distanceToSurface!=undefined )
        this.distanceToSurface = distanceToSurface;
    if ( this.distanceToSurface!=undefined )
        while ( distToCamera > this.distanceToSurface ) distToCamera /= 2;
    dir.scaleInPlace( distToCamera );
    dir.addInPlace( camera.position );
// The global world transform is a 90 degrees rotation around X.
// So we should position the object in such a position, so it is
// between camera and the object after global world transform
    OBJECT[this.objID].translate( dir.x, dir.z, -dir.y );
// Calculate orientation
    dir = camera.getDirectionFromScreen( CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH, CANVAS_HEIGHT );
    var theta = Math.atan2( dir.x, dir.y )*180/Math.PI;
    var phi = Math.asin( dir.z )*180/Math.PI;
    var psi = 0;
    if ( this.isArrow )
    {
        psi = Math.atan2( this.y0, CANVAS_WIDTH-this.x0-50 )*180/Math.PI;   // Popup is above the upper right corner
    }
    OBJECT[this.objID].rotate( theta, -phi, psi );
}



/***************************************/
/*           S C R I P T               */
/***************************************/

DEBUG = false;

var GLOBAL_VAR = new Array();

function Script(
    id,       // String
    desc,     // String
    builtin,  // Boolean
    pre,      // Array, where pre[variable]==value, no special class to represent this
    assign,   // Array, where assign[variable]==value, no special class to represent this
    beforeScript,  // Array
    beforeScriptDuration,  // Array
    at        // Array of At objects
    )
{
    this.id = id;
    this.desc = desc;
    this.builtin = builtin;
    this.pre = pre;
    this.assign = assign;
    this.beforeScript = beforeScript;
    this.beforeScriptDuration = beforeScriptDuration;
    this.at = at;
    if ( at==null )
    {
        this.myDuration = 0.0;
        this.numAts = 0;
    }
    else
    {
        this.myDuration = at[at.length-1].t;
        this.numAts = at.length;
        this.atRunning = new Array(this.numAts);
        for( var j=0; j<this.numAts; j++)
        {
            this.atRunning[j] = false;
        }
    }
    this.currentBeforeRate = 1.0;
    this.currentState = "STATE_WAITING_FOR_BEFORE";
    this.currentBeforeIdx = 0;
}

/** Get into the ready-to-play state.
 * @return false if the preconditions failed, true otherwise
 */
Script.prototype.prepareToPlay = function()
{
//    if ( DEBUG )
//        console.println("Prepare to play "+this.id);
    if ( this.id==INIT_SCRIPT_NAME ) // This is an init script
        GLOBAL_VAR = new Array();   // Clear all variables
    if(!this.testPreconditions()) return false;
    if ( DEBUG )
        console.println("Preconditions are OK "+this.id);

    this.currentTime = 0;
    this.currentState = "STATE_WAITING_FOR_BEFORE";
    this.isFirstView = true;

    // Clear any of the running Ats
    this.clearRunningAts();

    // Prepare the first "Before" script
    if(this.beforeScript != null)
    {
        for( this.currentBeforeIdx=0; this.currentBeforeIdx < this.beforeScript.length; this.currentBeforeIdx++)
        {
            var scriptID = this.beforeScript[this.currentBeforeIdx];
            this.currentBeforeRate = 1.0;
            this.script = SCRIPT[scriptID]; // SCRIPT is a global array of objects indexed by their names
            var duration = this.beforeScriptDuration[this.currentBeforeIdx];
            if( duration!=null && duration >=0.0 )
                this.currentBeforeRate = this.script.getDuration()/(0.001+duration);
            if(this.script.prepareToPlay())
                break;
        }
    }
    return true;
}

/** Clear any of the running Ats **/
Script.prototype.clearRunningAts = function()
{
    for(var i=0; i<this.numAts; i++)
        this.atRunning[i] = false;
    this.haveRunningAts = false;
}

/** Fast forward through the whole script to get to the indicated time.
 * @return false if the preconditions failed, true otherwise
 */
Script.prototype.jumpCurrent = function(time)
{
//    if ( DEBUG )
//        console.println(this.id+".jumpCurrent "+time);
    if ( this.id==INIT_SCRIPT_NAME ) // This is an init script
        GLOBAL_VAR = new Array();   // Clear all variables
    if(!this.testPreconditions()) return false;
    if(time<0) time = 0;

    // Clear any of the running Ats
    this.clearRunningAts();

    if(this.beforeScript != null)
    {
        // Instantly fast-forward all the befores to their respective end states
        for( var i=0; i<this.beforeScript.length; i++)
        {
            var scriptID = this.beforeScript[i];
            this.script = SCRIPT[scriptID]; // SCRIPT is a global array of objects indexed by their names
            this.script.jumpCurrent(this.script.getDuration());
        }
    }

    // Fast forward through the Ats up to the specified time
    for(this.currentAtIdx = 0; (this.currentAtIdx < this.numAts) && (this.at[this.currentAtIdx].t <= time); this.currentAtIdx++)
        // Execute the At
        this.executeAt(this.currentAtIdx, 0, time, true);

    if (time >= this.myDuration)
    {
        if( this.haveRunningAts )
            this.currentState = "STATE_WAITING_FOR_TASKS";
        else
        {
            this.setAssignments();
            this.currentState = "STATE_FINISHED";
        }
    }
    else
        this.currentState = "STATE_PLAYING";
    this.currentTime = time;
//    if ( DEBUG )
//        console.println(this.id+".jumpCurrent "+this.currentState);
    return true;
}

Script.prototype.jumpToEnd = function()
{
//    if ( DEBUG )
//        console.println(this.id+".jumpToEnd ");
    this.jumpCurrent(this.getDuration());
}

/** Step time forward.
 * @return true if the script has finished playing
 */
Script.prototype.stepCurrent = function(deltaTime)
{
//    if ( DEBUG )
//        console.println(this.id+".stepCurrent "+this.currentState);
    if( this.currentState == "STATE_FINISHED" )
        return true;

    if( this.currentState == "STATE_WAITING_FOR_BEFORE" )
    {
        // Step the current "Before" script, and if it finishes, prepare the next one
        if(this.beforeScript != null)
        {
            var doPrepare = false;
            for( ; this.currentBeforeIdx < this.beforeScript.length; this.currentBeforeIdx++)
            {
                var beforeScriptID = this.beforeScript[this.currentBeforeIdx];
                if(doPrepare)
                {
                    this.currentBeforeRate = 1;
                    this.script = SCRIPT[beforeScriptID];
                    var duration = this.beforeScriptDuration[this.currentBeforeIdx];
                    if( duration != null && duration >= 0 )
                          this.currentBeforeRate = this.script.getDuration()/(0.001+this.beforeScriptDuration[this.currentBeforeIdx]);
                    if(!this.script.prepareToPlay())
                        continue;
                }

                // Step the current "Before" script according to its rate
                if(!this.script.stepCurrent(deltaTime*this.currentBeforeRate))
                    // If it isn't finished, we're done
                    return false;

                // If the current "Before" is finished, prepare the next one
                doPrepare = true;
            }
        }

        // Clear any of the running Ats
        this.clearRunningAts();

        // Switch to PLAYING state at time 0
        this.currentState = "STATE_PLAYING";
        this.currentTime = 0;
        this.currentAtIdx = 0;
    }
    else
        // step the time pointer
        this.currentTime += deltaTime;

    // Re-execute all the currently running "Ats"
    if( this.haveRunningAts )
    {
        this.haveRunningAts = false;
        for( atIdx=0; atIdx<this.currentAtIdx; atIdx++)
            if( this.atRunning[atIdx])
                // Execute in "Step" mode
                this.executeAt(atIdx, deltaTime, this.currentTime, false);
    }

    // Play forward through the "Ats" up to the current time
    if( this.currentState == "STATE_PLAYING")
    {
        for (; (this.currentAtIdx < this.numAts); this.currentAtIdx++)
        {
            if ( (this.at[this.currentAtIdx].t > this.currentTime) ) break;
            // Execute in "Start" mode
            this.executeAt(this.currentAtIdx, 0, this.currentTime, false);
        }
    }

    finished = false;
    if( this.currentTime >= this.myDuration)
    {
        if(!this.haveRunningAts)
        {
            this.setAssignments();
            this.currentState = "STATE_FINISHED";
            this.finished = true;
        }
        else
            this.currentState = "STATE_WAITING_FOR_TASKS";
    }
    return finished;
}


/**
 * Execute a given "At". There are three possible "execution modes": "Start", "Jump" and "Step".
 * "Jump"  mode is used when (isJump == true)
 * "Start" mode is used when (!isJump && deltaTime == 0f)
 " "Step"  mode is used when (!isJump && deltaTime != 0f)
 * In both "Start" and "Jump" modes the variable assignemnts are performed.
 * In "Step" mode no variable assignments are performed.
 * In "Start" mode, if there is a spawned script, it is told to prepareToPlay().
 * In "Jump" mode, if there is a spawned script, it is told to jumpCurrent(..) to the appropriate time.
 * In "Step" mode, if there is a spawned script, it is told to stepCurrent(deltaTime).
 * In all three modes the dependent view and sequence is set/interpolated according to the absTime.
 *
 * If the absTime is not past this "At"'s area of influence, the at is marked as running, and the value of true is returned.
 * @param atIdx the index of the "At" to execute.
 * @param deltaTime the amount of time change for the "Step" mode.
 * @param absTime absolute current time.
 * @param isJump if true, selects the "Jump" mode; if false and deltaTime is 0, "Start" mode is used.
 * @return false if absTime is outside of this "At"'s area of influence.
 **/
Script.prototype.executeAt = function( atIdx, deltaTime, absTime, isJump )
{

    this.leaveRunning = false;
    at = this.at[atIdx];
    // Time of the current At
    t = at.t;

    // perform necessary variable assignments only if this is not an incremental step
    if( deltaTime == 0 && at.assign != null )
    {
        for ( varName in at.assign )
            setGlobalVar( "executeAt 1", varName, at.assign[varName] );
    }

    // If spawning a script, prepare/step/jump the script to the appropriate time
    if( at.script != null)
    {
        s = SCRIPT[at.script];
        if(s != null)
        {
            this.leaveRunning = true;
            if(isJump)
                s.jumpCurrent(absTime - t);
            else
                if(deltaTime == 0)
                    s.prepareToPlay();
                else
                    if(!s.stepCurrent(deltaTime))
                        this.leaveRunning = false;
        }
    }

    dt = 0;
    duration = 0;
    nextAtIdx = at.nextIdx

    if(nextAtIdx > atIdx)
    {
        duration = this.at[nextAtIdx].t - t;
        dt = 1; // So that two adjecent At's with ==t will jump to the second..
    }

    if(duration > 0)
    {
        // Prepare dt for interpolation
        dt = (absTime - t) / duration;
        if (dt > 1) dt = 1;
    }

    if(nextAtIdx > atIdx && dt < 1)
        this.leaveRunning = true;

    // Set the view
    if(at.view != null)
    {
        var loView = this.at[atIdx].view;
        if(loView != null && VIEW[loView]!=GOAL_VIEW) // Has not been assigned for smooth camera motion before
        {
            if ( isJump )
                VIEW[loView].setCurrent();
            else
                setCameraMotionGoal( VIEW[loView] ); // This will set GOAL_VIEW global variable
            this.atRunning[atIdx] = false; // Don't consider this At anymore
            this.leaveRunning = false;
        }
    }
    // Set the sequence parameter
    if(at.sequence != null)
    {
        s = SEQUENCE[at.sequence];

        if ( at.p != null )
            p = at.p;
        else
            p = 0;
        if(s != null)
        {
            if ( at.waypointID!=null )
                s.setCurrentID( at.waypointID );
            else
            {
                nextP = ((nextAtIdx > atIdx && this.at[nextAtIdx].p != null) ? this.at[nextAtIdx].p : p);
                s.setCurrentP(p + dt * (nextP - p));
            }
        }
    }

    // Determine if we're past our area of influence
    if( this.leaveRunning )
    {
        this.haveRunningAts = true;
        this.atRunning[atIdx] = true;
        return true;
    }
    else
    {
        this.atRunning[atIdx] = false;
        return false;
    }
}

/**
 * Get the duration of this script, including the duration
 * of any of the scripts it may invoke.
 * @return the amount of time from the beginning of the script, until
 *         the last "At" of this or any of the spawned scripts fires.
 **/
Script.prototype.getDuration = function()
{
    dur = this.myDuration;
    for ( i=0; i<this.numAts;i++)
    {
        if (this.at[i].script != null)
        {
            sd = SCRIPT[this.at[i].script].getDuration() + this.at[i].t;
            if (sd > dur)
                dur = sd;
        }
    }
    return dur;
}


/**
 * Test the pre-conditions for this script.
 * @return true if all the pre-conditions were satisfied.
 **/
Script.prototype.testPreconditions = function()
{
    if( this.pre != null )
        for ( varName in this.pre )
        {
            if ( varName=="host" && this.pre[varName]!="PDF" ) // Special system variable to check if script is running in PDF environment
                return false;
            else
            if( GLOBAL_VAR[varName]!=this.pre[varName] )
            {
                if ( DEBUG )
                    console.println("Check "+varName+" equals to "+ this.pre[varName]+". Actual value is "+GLOBAL_VAR[varName]);
                return false;
            }
        }
    return true;
}

/** Perform the variable assignments that must be done at the end of this script. **/
Script.prototype.setAssignments = function()
{
    if( this.assign != null)
        for ( varName in this.assign)
        {
            if ( DEBUG )
                console.println("assign "+varName+" = "+this.assign[varName]);
            setGlobalVar( "setAssignments", varName, this.assign[varName] );
        }
}

function getCurrentTooltip( menuItem )
{
    var scripts = MENU_SCRIPT[ menuItem ];
    if ( scripts==undefined )
        scripts = MENU_SCRIPT[ MENU_ITEM_NAME[menuItem] ];
    if ( scripts==undefined ) return "";
    var tooltips = MENU_TOOLTIP[ menuItem ];
    if ( tooltips==undefined )
        tooltips = MENU_TOOLTIP[ MENU_ITEM_NAME[menuItem] ];
    for( var j=0; j<scripts.length; j++)
    {
        if ( SCRIPT[scripts[j]].testPreconditions() )
            return tooltips[j];
    }
    return ""; // No one sctipt is ready to play
}

function isReadyToPlay( scriptID )
{
    return SCRIPT[scriptID].testPreconditions();
}

var MENU_ITEM_NAME = new Array();

function getMenuCount()
{
    return MENU_ITEM_NAME.length;
}

function getMenuItem(j)
{
    return (CURRENT_STRING = MENU_ITEM_NAME[j]);
}


/***************************************/
/*               A T                   */
/***************************************/

function At(
    t,              // Float
    view,           // String
    sequence,       // String
    p,              // Float
    waypointID,       // String
    waypointObject, // Waypoint object
    script,         // String
    assign,         // Array like assign[variable]==value
    nextIdx,
    )
{
    this.t = t;
    this.view = view;
    this.sequence = sequence;
    this.p = p;
    this.waypointID = waypointID;
    this.waypointObject = waypointObject;
    this.script = script;
    this.assign = assign;
    this.nextIdx = nextIdx;
    if ( this.p==null )
    { // If P is not set, substitute P from the corresponding sequence's waypoint
        seq = SEQUENCE[sequence];
        if ( seq!=null )
        {
            wps = seq.waypoint;
            if ( wps!=null )
                for( wpIdx=0; wpIdx<wps.length; wpIdx++)
                {
                    wp = wps[wpIdx];
                    if(waypointID==wp.id)
                    {
                        this.p = wp.p;
                        break;
                    }
                }
        }
    }
}

/***************************************/
/*        S E Q U E N C E              */
/***************************************/

DEBUG = false;

function Sequence(
    parent,   // String
    id,       // String
    desc,     // String
    object,   // String
    sequence,  // Array of Sequences
    waypoint // Array of Waypoints
    )
{
    this.parent = parent;
    this.id = id;
    this.desc = desc;
    this.object = object;
    this.waypoint = waypoint;
    this.sequence = sequence;
}

Sequence.prototype.setCurrentID = function(waypointID)
{
    if ( DEBUG )
        console.println("Sequence "+this.id+" setCurrentID "+waypointID);
    if ( waypointID == null || waypointID.length == 0 )
    {
        return false;
    }
    wps = this.waypoint;
    for( wpIdx=0; wpIdx<wps.length; wpIdx++)
    {
        wp = wps[wpIdx];
        if(waypointID==wp.id)
        {
            if ( this.object != null )
            {
                if ( OBJECT[this.object]!=undefined )
                    OBJECT[this.object].apply(wp.position, wp.pivot, wp.orientation, null, wp.alpha );
            }
            wp.applySwaps();
            setGlobalVar( "setCurrentID", this.id, waypointID);
            setGlobalVar( "setCurrentID", this.id+"_p", this.p);
            return true;
        }
     }
     return false;
}

Sequence.prototype.setCurrentP = function(p)
{
    if ( DEBUG )
        console.println("Sequence "+this.id+" setCurrentP "+p);
    wps = this.waypoint;
    // Search for the correct waypoint parameter value
    for(hiWpIdx = 0; hiWpIdx < wps.length && p > wps[hiWpIdx].p; hiWpIdx++);
    match = (hiWpIdx == 0) || (hiWpIdx >= wps.length) || (wps[hiWpIdx].p == p);
    if (hiWpIdx >= wps.length)
        hiWpIdx = wps.length-1;
    loWpIdx = (match?hiWpIdx:(hiWpIdx-1));
    if ( match )
        this.setCurrentID( wps[hiWpIdx].id );
    else
        this.setCurrentWP( loWpIdx, hiWpIdx, p );
    if ( this.sequence != null )
        for( var j=0; j<this.sequence.length; j++)
            this.sequence[j].setCurrentP( p );
}

// Private method
Sequence.prototype.setCurrentWP = function( loWpIdx, hiWpIdx, p)
{
    var loWp = this.waypoint[loWpIdx];
    var hiWp = this.waypoint[hiWpIdx];
    dp = (p - loWp.p) / (hiWp.p - loWp.p);

    if ( loWp.position!=null && hiWp.position!=null )
    {
        position = new Vector3();
        position.x  = loWp.position.x+ dp * (hiWp.position.x - loWp.position.x);
        position.y  = loWp.position.y+ dp * (hiWp.position.y - loWp.position.y);
        position.z  = loWp.position.z+ dp * (hiWp.position.z - loWp.position.z);
    }
    else
        position = null;

    if ( loWp.pivot!=null && hiWp.pivot!=null )
    {
        pivot = new Vector3();
        pivot.x  = loWp.pivot.x+ dp * (hiWp.pivot.x - loWp.pivot.x);
        pivot.y  = loWp.pivot.y+ dp * (hiWp.pivot.y - loWp.pivot.y);
        pivot.z  = loWp.pivot.z+ dp * (hiWp.pivot.z - loWp.pivot.z);
    }
    else
        pivot = null;

    quaternion = null;
    if ( loWp.orientation!=null && hiWp.orientation!=null )
    {
        orientation = new Vector3(loWp.orientation.x,loWp.orientation.y,loWp.orientation.z);
        dTheta = hiWp.orientation.x - loWp.orientation.x;
        dPhi = hiWp.orientation.y - loWp.orientation.y;
        dPsi = hiWp.orientation.z - loWp.orientation.z;
        if (dPhi==0.0 && dPsi==0.0)
            orientation.x = loWp.orientation.x + dp*dTheta;
        else
        if (dTheta==0.0 && dPsi==0.0)
            orientation.y = loWp.orientation.y + dp*dPhi;
        else
        if (dTheta==0.0 && dPhi==0.0)
            orientation.z = loWp.orientation.z + dp*dPsi;
        else
        {
            // More than one parameter is changing, so go thru the quaternion interpolation
            // This algorithm is different off the one used in SequenceRuntime, just for simplicity
            orientation = null;
            quaternion = interpolate( loWp.orientation, hiWp.orientation, dp );
        }
    }
    else
        orientation = null;
    if ( loWp.alpha!=null && loWp.alpha!=null )
        alpha  = loWp.alpha + dp*(hiWp.alpha - loWp.alpha);
    else
        alpha = null; // Don't change alpha
    if ( this.object != null )
        OBJECT[this.object].apply(position, pivot, orientation, quaternion, alpha );
    if ( loWp.isFilterMaterial() && hiWp.isFilterMaterial() )
    {
        for( from in loWp.swapMaterial )
            for( from2 in hiWp.swapMaterial )
            {
                var mat = loWp.swapMaterial[from]; // This is an array containing names of swap objects relative to this swapFrom material
                if ( mat==hiWp.swapMaterial[from2] )
                {
                    copyColor2( from, from2, dp, mat );
                    refreshNodeMaterials();
                }
            }
    }
    else
        loWp.applySwaps();
    setGlobalVar( "setCurrentWP", this.id, null );
    setGlobalVar( "setCurrentWP", this.id+"_p", p );
}

tempMatrix = new Matrix4x4();

function interpolate( orientation0, orientation1, p)
{
    tempMatrix.setIdentity();
    rotateWithAngles(tempMatrix,orientation0);
    quaternion0 = new Quaternion(tempMatrix);
    tempMatrix.setIdentity();
    rotateWithAngles(tempMatrix,orientation1);
    quaternion1 = new Quaternion(tempMatrix);
    return quaternion0.interpolate( quaternion1, p );
}

/***************************************/
/*         W A Y P O I N T             */
/***************************************/

function Waypoint(
    id,          // String
    p,           // Float
    desc,        // String
    position,    // Vector3
    pivot,       // Vector3
    orientation, // Vector3
    alpha,       // Float, 0.0 - Hide, 1.0 - Show,  0.0<alpha<1.0 - Transparent
    swapMaterial // Array of material names
    )
{
    this.id = id;
    this.p = p;
    this.desc = desc;
    this.position = position;
    this.pivot = pivot;
    this.orientation = orientation;
    this.alpha = alpha
    this.swapMaterial = swapMaterial
}

Waypoint.prototype.applySwaps = function()
{
    if ( this.swapMaterial==null ) return;
    for( swapTo in this.swapMaterial )
    {
        var swapFrom = this.swapMaterial[swapTo]; // This is an array containing names of swap objects relative to this swapFrom material
        if ( typeof swapFrom == "string" )
        {
            copyColor( swapTo, swapFrom );
        }
        else
            for( mat in swapFrom )
            {
                var objName = swapFrom[mat];
                for( var j=0; j<objName.length; j++)
                {
                    var node = scene.nodes.getByName( objName[j] )
                    if ( node==undefined ) continue;
                    var object = OBJECT[objName[j]];
                    if ( object==undefined ) return;
                    object.selected = ( mat==swapTo ? 1 : 0 );
                    object.applyAlpha( OBJECT[object.alphaObject].alpha );
                }
            }
    }
}

Waypoint.prototype.isFilterMaterial = function()
{
    if ( this.swapMaterial==null ) return false;
    for( swapTo in this.swapMaterial )
    {
        var mat = this.swapMaterial[swapTo];
        if ( swapTo.indexOf("filter_"+mat)<=1 ) // Starts with "filter_ or "cfilter_"
            return true;
    }
    return false;
}
/***************************************/
/*            T I M E R                */
/***************************************/
var _LAST_TIME_ = 0;
var CURRENT_TIME = 0;
var _SCHEDULED_ = null;
var _RUNNING_ = null;
var INITIALIZED = false;
var LAUNCH_URL = null;
var SET_BGCOLOR = true;
var SET_BLACK_BGCOLOR = false;

// Global variables for smooth camera motion
var CAMERA_MOTION_START_TIME;
var CAMERA_MOTION_LAST_TIME;
var GOAL_VIEW = null;
var CAMERA_MOTION_DURATION = 3.0;

// Counting FPS
var FPS_PERIOD = 4;
var CURRENT_SECOND = 0;
var FPS_COUNTER = new Array(FPS_PERIOD);
var FPS_SECOND = new Array(FPS_PERIOD);
var FPS_AVERAGE = null;

var CANVAS_WIDTH = 400;
var CANVAS_HEIGHT = 400;
var n = 0;
var SHOW_ANNOTATION = false;
var ANNOTATION_CONTENTS = null;
var ANNOTATION_X = 0;
var ANNOTATION_ID = "";
var ANNOTATION_INDEX = -1;
var ANNOTATION_SCRIPT = null;
var SWITCH_TO_ROTATE_MODE = false;
var ROTATE_MODE = true;
var MOVE_MODE = false;
var MEASURE_MODE = false;
var BENCHMARK_MODE = false;
var MEASURE_ORIGIN = null;
var MEASURE_TARGET = null;
var CURRENT_MEASUREMENT = "";
var MEASUREMENT_UNIT = "inch"; // another valid value is "centimeter";
var HOTSPOT_RESCALING_POWER = 0.0;
var HOTSPOT_SCALE = 1.0;
var HOTSPOT_KEEP_POPUP = false;
var BLINK_PERIOD = 0.5;
var blinkingHotspot = null;
var blinkerTime = 0;
var FPS = 1000000;
var REFRESH_TOOLTIPS = true;
var MESSAGE = null;
var WIREFRAME_MODE = false;
var ILLUSTRATION_MODE = false;
var SHADED_ILLUSTRATION_MODE = false;
var renderingDone = false;
var LIMIT_ZOOM = true;
var MOUSE_DOWN = false;
var MOUSE_UP = false;
var CURRENT_STRING = "";
var REQUEST_FIELDS_CHANGE = null;
var DYN_FIELD_SELECTOR = null;

var renderHandler = new RenderEventHandler();
renderHandler.onEvent = function( event )
{
    if ( event.canvasPixelWidth!=CANVAS_WIDTH )
        SWITCH_TO_ROTATE_MODE = true;
    CANVAS_WIDTH = event.canvasPixelWidth; // Canvas size could be changed anytime on PDF page zooming in/out
    CANVAS_HEIGHT = event.canvasPixelHeight;
    setDynamicHotspotSize();
    if ( SET_BLACK_BGCOLOR )
    {
        event.canvas.background.setColor( new Color(0,0,0));
        SET_BLACK_BGCOLOR = false;
    }
    if ( SET_BGCOLOR )
    {
        event.canvas.background.setColor( new Color(__DEFAULT_BGR_COLOR_R__,__DEFAULT_BGR_COLOR_G__,__DEFAULT_BGR_COLOR_B__));
        SET_BGCOLOR = false;
    }
    countFPS( CURRENT_TIME );
    renderingDone = true;
}
runtime.addEventHandler( renderHandler );


var timeHandler = new TimeEventHandler();
timeHandler.onEvent = function( event )
{
    var forceRefresh = false;
    CURRENT_TIME = event.time;
    if ( GOAL_VIEW != null )
    {
        if ( MOUSE_DOWN || (CURRENT_TIME != CAMERA_MOTION_LAST_TIME || CAMERA_MOTION_LAST_TIME == CAMERA_MOTION_START_TIME) )
        {
            var deltaTime = CURRENT_TIME - CAMERA_MOTION_LAST_TIME;
            var base = 0.05;
            if ( _RUNNING_!=null )
                base = 0.15;
            if ( (CURRENT_TIME-CAMERA_MOTION_START_TIME > CAMERA_MOTION_DURATION) && (!MOUSE_DOWN || MOUSE_UP))
            { // Just to stop excessive interpolations
                GOAL_VIEW.setCurrent();
                GOAL_VIEW = null;
                if ( _RUNNING_==null ) // No scripts are executing at the moment
                    REFRESH_TOOLTIPS = true;
                if ( CUSTOM_NAVIGATION )
                    restoreCameraTheta();
                if ( MOUSE_UP )
                {
                    MOUSE_DOWN = false;
                    MOUSE_UP = false;
                }
            }
            else
            {
                if (deltaTime>0 )
                {
                    var alpha = 1 - Math.pow(base, deltaTime );
                    if ( alpha==1.0 )
                    {
                        GOAL_VIEW.setCurrent();
                        GOAL_VIEW = null;
                    }
                    else
                        CAMERA.setInterpolated( GOAL_VIEW, alpha );
                }
            }
            forceRefresh = true;
        }
        CAMERA_MOTION_LAST_TIME = CURRENT_TIME;
    }
    if ( _RUNNING_!=null )
    {
        for( var j=0; j<OBJECT2D.length; j++)
            OBJECT2D[j].setVisible(false);
        if ( CURRENT_TIME != _LAST_TIME_ )
        {
            performScript( CURRENT_TIME );
            updateEHLs();
            forceRefresh = true;
        }
    }
    else
    {
        for( var j=0; j<OBJECT2D.length; j++)
        {
            if ( OBJECT2D[j].isActive() )
            {
                OBJECT2D[j].setPosition( undefined )
                OBJECT2D[j].setVisible(true);
                forceRefresh = true;
            }
        }
    }
    if ( blinkingHotspot!=null )
    {
        if ( CURRENT_TIME-blinkerTime>BLINK_PERIOD)
        {
            var node = scene.nodes.getByName( blinkingHotspot );
            node.visible = !node.visible;
            node = scene.nodes.getByName( blinkingHotspot+"_mesh" );
            if ( node != undefined )
                node.visible = !node.visible;
            blinkerTime = CURRENT_TIME;
            forceRefresh = true;
        }
    }
    if ( BENCHMARK_MODE )
    {
        rotateView( 5, 0 );
        forceRefresh = true;
    }
    if ( forceRefresh )
        runtime.refresh();
}
runtime.addEventHandler( timeHandler );

var menuHandler = new MenuEventHandler();
menuHandler.onEvent = function( event )
{
    if ( event.menuItemName=="About Kaon...")
    {
        LAUNCH_URL = "http://www.kaon.com/aboutPDF";
        return;
    }
    if ( event.menuItemName=="About Strata...")
    {
        LAUNCH_URL = "http://www.strata.com/rd/live3dmenu.html";
        return;
    }
    if ( event.menuItemName==MSG_MEASURE_IN_INCHES)
    {
        MEASUREMENT_UNIT = "inch";
        return;
    }
    if ( event.menuItemName==MSG_MEASURE_IN_CENTIMETERS)
    {
        MEASUREMENT_UNIT = "centimeter";
        return;
    }
    if ( event.menuItemName==MSG_HOTSPOTS)
    {
        setHotspotsPermanentVisibility( event.menuItemChecked );
        return;
    }
    execMenuItem(event.menuItemName);
}
runtime.addEventHandler( menuHandler );

var SECRET_KEY = 777;
var secretKey = 0;
var keyHandler = new KeyEventHandler();
keyHandler.onEvent = function( event )
{
    if ( secretKey!=SECRET_KEY && event.characterCode>=48 && event.characterCode<=57 )
        secretKey = (secretKey*10 +(event.characterCode-48))%1000;
    if ( secretKey!=SECRET_KEY ) return;
    if ( (event.characterCode==70 || event.characterCode==102) ) // 'F' or 'f'
    {
        FPS_AVERAGE = getFPS();
    }
    if ( (event.characterCode==67 || event.characterCode==99) ) // 'C' or 'c'
    {
        MESSAGE =
            "Kaon U3D Exporter Version "+EXPORTER_VERSION+"\n"+
            "Adobe U3D Runtime Version "+runtime.version+" ("+runtime.getRendererName()+")\n"+
            "Objects Count = "+OBJECTS_COUNT+"\n"+
            "Triangles Count = "+TRIANGLE_COUNT+"\n"+
            "Textures Count = "+TEXTURE_COUNT+"\n"+
            "Total Texture Size = "+Math.round((TOTAL_TEXTURE_SIZE/1024/1024)*100)/100+" Mpixels\n"
        ;
    }
    if ( (event.characterCode==73 || event.characterCode==105) ) // 'I' or 'i'
    {
        if ( !ILLUSTRATION_MODE || WIREFRAME_MODE || SHADED_ILLUSTRATION_MODE)
            setRenderMode( "illustration" );
        else
            setRenderMode( "solid" );
        ILLUSTRATION_MODE = !ILLUSTRATION_MODE;
        SHADED_ILLUSTRATION_MODE = false;
        WIREFRAME_MODE = false;
    }
    if ( (event.characterCode==83 || event.characterCode==115) ) // 'S' or 's'
    {
        if ( !SHADED_ILLUSTRATION_MODE || WIREFRAME_MODE || ILLUSTRATION_MODE )
            setRenderMode( "shaded illustration" );
        else
            setRenderMode( "solid" );
        SHADED_ILLUSTRATION_MODE = !SHADED_ILLUSTRATION_MODE;
        ILLUSTRATION_MODE = false;
        WIREFRAME_MODE = false;
    }
    if ( (event.characterCode==87 || event.characterCode==119) ) // 'W' or 'w'
    {
        if ( !WIREFRAME_MODE || ILLUSTRATION_MODE || SHADED_ILLUSTRATION_MODE )
            setRenderMode( "wireframe" );
        else
            setRenderMode( "solid" );
        WIREFRAME_MODE = !WIREFRAME_MODE;
        ILLUSTRATION_MODE = false;
        SHADED_ILLUSTRATION_MODE = false;
    }

    if ( (event.characterCode==77 || event.characterCode==109) ) // 'M' or 'm'
    {
        MESSAGE =" Lights:\n";
        for( var j=0; j<scene.lights.count; j++)
        {
            var light = scene.lights.getByIndex(j);
            MESSAGE += light.name+" "+light.brightness+"\n";
        }
    }
    if ( (event.characterCode==66 || event.characterCode==98) ) // 'B' or 'b'
    {
        BENCHMARK_MODE = !BENCHMARK_MODE;
		if ( !BENCHMARK_MODE )
	        FPS_AVERAGE = getFPS();
    }
    if ( (event.characterCode==76 || event.characterCode==108) ) // 'L' or 'l'
    {
        LIMIT_ZOOM = !LIMIT_ZOOM;
    }
}

runtime.addEventHandler( keyHandler );

// Start the script
function startScript( scriptID )
{
    if ( _RUNNING_!=null )
    {
        return false;
    }
    else
    {
        if ( SCRIPT[scriptID].prepareToPlay() )
        {
            _LAST_TIME_ = CURRENT_TIME;
            _RUNNING_ = scriptID;
            setHotspotsTemporaryVisibility( false );
            return true;
        }
    }
    return false;
}

// Start one or two of the scripts which are ready to play.
// If more than two are ready to play, the rest are ignored.
// This method is called by MenuEventHandler.
function startScripts( scripts )
{
    if ( _RUNNING_!=null ) return;
    setCurrentTool("Rotate"); // Switch back to Rotate mode after each menu event
    SWITCH_TO_ROTATE_MODE = true; // This will switch the icon on the toolbar
    deleteMeasuringCursors();
    for( var j=0; j<scripts.length; j++)
    {
        if ( SCRIPT[scripts[j]].prepareToPlay() )
        {
            _LAST_TIME_ = CURRENT_TIME;
            _RUNNING_ = scripts[j];
            setHotspotsTemporaryVisibility( false );
            break;
        }
    }
}

function execMenuItem( menuItem )
{
    if ( _RUNNING_!=null )
    {
        if ( _SCHEDULED_==null )
            _SCHEDULED_ = menuItem;
        return;
    }
    GOAL_VIEW = null;
    MOUSE_DOWN = false;
    MOUSE_UP = false;
    restoreCameraTheta();
    deleteAnnotation();
    if ( DYN_FIELD_SELECTOR!=null )
    {
        var id = DYN_FIELD_SELECTOR[menuItem];
        if ( id!=undefined )
        {
            REQUEST_FIELDS_CHANGE = id;
        }
    }
    var scripts = MENU_SCRIPT[menuItem];
    startScripts( scripts );
}



function performScript( now )
{
    var deltaTime = now -_LAST_TIME_;
    _LAST_TIME_ = now;
    var finished = SCRIPT[_RUNNING_].stepCurrent( deltaTime );
    if ( finished )
    {
        _RUNNING_ = null;
        setHotspotsTemporaryVisibility( true );
        setBlinkingHotSpot( null );
        deleteAnnotation();
        if ( _SCHEDULED_!=null )
        {
            var scheduled = _SCHEDULED_;
            _SCHEDULED_ = null;
            execMenuItem( scheduled );
        }
        else
            if ( GOAL_VIEW==null ) // No camera motion at the moment
                REFRESH_TOOLTIPS = true;
    }
}

function Init()
{
    var ok = startScript("init");
    if ( ok )
        INITIALIZED = true;
}

function setCameraMotionGoal( view )
{
    GOAL_VIEW = view;
    CAMERA_MOTION_START_TIME = CURRENT_TIME;
    CAMERA_MOTION_LAST_TIME = CAMERA_MOTION_START_TIME;
}

function setGlobalVar( callerID, name, value )
{
    GLOBAL_VAR[name] = value;
    activateHotspot( name, value );
}

function resetUnconditionally()
{
    _RUNNING_ = null;
    _SCHEDULED_ = null;
    execMenuItem(MSG_RESET);
}

function zoomIn()
{
    var newView = new View();
    newView.getCameraPosition();
    if ( newView.minFOV == undefined || newView.minFOV == 0 )
        newView.minFOV = 6.667;
    newView.fov = Math.max(newView.fov*0.8,newView.minFOV);
    setCameraMotionGoal( newView );
}

function zoomOut()
{
    var newView = new View();
    newView.getCameraPosition();
    if ( newView.maxFOV == undefined || newView.maxFOV == 0 )
        newView.maxFOV = 28.0001;
    newView.fov = Math.min(newView.fov*1.2,newView.maxFOV);
    setCameraMotionGoal( newView );
}

function countFPS( now )
{
    var second = Math.floor(now);
    var index = second % FPS_PERIOD;
    CURRENT_SECOND = second;
    if ( FPS_SECOND[index]!=second )
    {
        FPS_COUNTER[index] = 0;
        FPS_SECOND[index] = second;
        FPS = getFPS();
    }
    FPS_COUNTER[index]++;
}

function getFPS()
{
    var s = 0;
    for( var j=0; j<FPS_PERIOD; j++)
        if ( FPS_SECOND[j]!=CURRENT_SECOND ) // Ignore the incomplete second
            s += FPS_COUNTER[j];
    return Math.round(10.0*s/(FPS_PERIOD-1))/10.0;
}

function showAnnotation( index, id, message, richTextMessage, script, x0, y0 )
{
    ANNOTATION_INDEX = index;
    ANNOTATION_ID = id;
    ANNOTATION_CONTENTS = message;
    ANNOTATION_RICH_CONTENTS = richTextMessage;
    ANNOTATION_X = x0/CANVAS_WIDTH;
    ANNOTATION_SCRIPT = script;
    SHOW_ANNOTATION = true;
    CURRENT_STRING = message;
}

function deleteAnnotation()
{
    SHOW_ANNOTATION = false;
    ANNOTATION_CONTENTS = null;
    CURRENT_STRING = "";
    ANNOTATION_ID = "";
}

function setMeasureMode( on, deactivateHotspots )
{
    ROTATE_MODE = false;
    MOVE_MODE = false;
    MEASURE_MODE = on;
    MEASURE_ORIGIN = null;
    MEASURE_TARGET = null;
    runtime.overrideNavTools = on
    if ( on )
    {
        CURRENT_MEASUREMENT = MSG_CLICK_AND_DRAG_TO_MEASURE;
        runtime.setCurrentTool("Rotate"); // Just to have proper mouse cursor appearance
    }
    else
        CURRENT_MEASUREMENT = ""; // hidden
    if ( !on )
    {
        deleteMeasuringCursors();
    }
    if (deactivateHotspots)
        setHotspotsTemporaryVisibility( !on );
}

function deleteMeasuringCursors()
{
    if ( OBJECT2D[0]!=undefined )
    {
        OBJECT2D[0].setVisible(false);
        OBJECT2D[0].setActive(false);
    }
    if ( OBJECT2D[1]!=undefined )
    {
        OBJECT2D[1].setVisible(false);
        OBJECT2D[1].setActive(false);
    }
}

function isMeasureMode()
{
    return MEASURE_MODE;
}

function setRenderMode( renderMode )
{
    for( var j=0; j<scene.nodes.count; j++ )
    {
        var mesh = scene.nodes.getByIndex(j);
        if ( renderMode == "wireframe" )
        { // This seems does not works, so only white wireframe color is available
            if ( mesh.wireframeColor!=null )
            {
                mesh.wireframeColor.r = 1.0;
                mesh.wireframeColor.g = 1.0;
                mesh.wireframeColor.b = 1.0;
            }
            else // It is null in Reader 7.0.7 version
                mesh.wireframeColor = new Color( 1,1,1 ); // The property declared to be "read-only" but this works
        }
        mesh.renderMode = renderMode;
    }
//    if ( renderMode=="wireframe" ) // Wireframe is on white background as in Reader 8.0 it doesn't accept mesh.wireframeColor properly
//        SET_BLACK_BGCOLOR = true;
//    else
        SET_BGCOLOR = true;
}

function printMaterials()
{
    var mat = scene.materials;
    for( var m=0; m<mat.count; m++)
    {
        var material = mat.getByIndex(m);
        console.println(material.name+" "+material.ambientColor+" "+material.diffuseColor+" "+material.emissiveColor+" "+material.specularColor+" "+material.specularStrength+" "+material.phongExponent);
    }
}

function setCurrentTool( tool )
{
    runtime.setCurrentTool(tool);
    if ( tool=="Rotate" )
    {
        ROTATE_MODE = true;
        MOVE_MODE = false;
    }
    else
    {
        ROTATE_MODE = false;
        MOVE_MODE = true;
    }
    MEASURE_MODE = false;
}

function getRequestedStringChar( k )
{
    return ( k<CURRENT_STRING.length ? CURRENT_STRING.charCodeAt(k) : null );
}

function getProductTitle()
{
    return CURRENT_STRING=PRODUCT_TITLE;
}

function refresh()
{
    runtime.refresh();
}

function getFieldValue( ID, fieldName )
{
    return eval( ID+"['"+fieldName+"']" );
}

setCurrentTool("Rotate");

/***************************************/
/*             V I E W                 */
/***************************************/
var DEG_TO_RAD = 0.017453293;
var COMPENSATE_BY_OBJECT_ROTATION = false;
var latestMinFOV = 6.667;
var latestMaxFOV = 28;
var CAMERA = new View(); // The view which is current set to the camera

function View(
        id,
        desc,
        theta,
        phi,
        cx,
        cy,
        fov,
        dist,
        x,
        y,
        z,
        minFOV,
        maxFOV
    )
{
    this.id = id;
    this.desc = desc;
    this.theta = theta
    this.phi = phi;
    this.cx = cx;
    this.cy = cy;
    this.fov = fov
    this.dist = dist;
    this.x = x;
    this.y = y;
    this.z = z;
    this.minFOV = minFOV;
    this.maxFOV = maxFOV;
}

View.prototype.setCurrent = function()
{
    runtime.overrideViewChange = true;
    var camera = scene.cameras.getByIndex(0);
    var theta = this.theta*DEG_TO_RAD;
    var phi = this.phi;
    if ( phi==90.0 ) phi = 89;
    if ( phi==-90.0 ) phi = -89;
    phi*=DEG_TO_RAD;
   // Target
    camera.targetPosition.x = this.x;
    camera.targetPosition.y = this.y;
    camera.targetPosition.z = this.z;
    // Camera position
    camera.position.x = this.x + this.dist*Math.cos(phi)*Math.sin(theta);
    camera.position.y = this.y - this.dist*Math.sin(phi);
    camera.position.z = this.z - this.dist*Math.cos(phi)*Math.cos(theta);

    adjustOnCxCy( camera, camera.targetPosition, camera.position, this.cx, this.cy, theta, phi, this.dist, Math.PI*this.fov/180.0 );

    t = camera.targetPosition.y;
    camera.targetPosition.y = camera.targetPosition.z;
    camera.targetPosition.z = t;

    t = camera.position.y;
    camera.position.y = camera.position.z;
    camera.position.z = t;
    // FOV
    camera.fov = Math.PI/180.0*this.fov;
    latestMinFOV = this.minFOV;
    latestMaxFOV = this.maxFOV;
    camera.roll = 0;
    CAMERA = this;
}

View.prototype.getCameraPosition = function()
{
    this.theta = CAMERA.theta;
    this.phi = CAMERA.phi;
    this.cx = CAMERA.cx;
    this.cy = CAMERA.cy;
    this.fov = CAMERA.fov
    this.dist = CAMERA.dist;
    this.x = CAMERA.x;
    this.y = CAMERA.y;
    this.z = CAMERA.z;
    this.minFOV = CAMERA.minFOV;
    this.maxFOV = CAMERA.maxFOV;
}

/** Set the current view to the values which interpolate two other views. */
View.prototype.setInterpolated = function( v1,  alphaF )
{
    if(v1 == null) v1 = this;
    var alpha = alphaF;
    var beta = 1.0 - alpha;
    var theta0 = this.theta;
    var  theta1 = v1.theta;
    if (!(CUSTOM_NAVIGATION && MOUSE_DOWN))
    {
        while (theta0>360.0) theta0 -= 360.0;
        while (theta0<0.0) theta0 += 360.0;
        while (theta1>360.0) theta1 -= 360.0;
        while (theta1<0.0) theta1 += 360.0;
        if ( Math.abs(theta0-theta1)>180.0)
            if ( theta0>theta1) theta0 -=360.0;
                else theta1 -= 360.0;
    }

    var theta = (theta0 * beta + theta1 * alpha);
//console.println("theta0="+theta0+" theta1="+theta1+" theta="+theta);
    var phi = (this.phi * beta + v1.phi * alpha);
    var fov = interpolateFOV(this.fov, beta, v1.fov, alpha);
    var dist = (this.dist * beta + v1.dist * alpha);
    var x = (this.x * beta + v1.x * alpha);
    var y = (this.y * beta + v1.y * alpha);
    var z = (this.z * beta + v1.z * alpha);
    var cx = (this.cx * beta + v1.cx * alpha);
    var cy = (this.cy * beta + v1.cy * alpha);
    var minFOV = (this.minFOV * beta + v1.minFOV * alpha);
    var maxFOV = (this.maxFOV * beta + v1.maxFOV * alpha);
    var interp = new View(
        "temp",
        "temp",
        theta,
        phi,
        cx,
        cy,
        fov,
        dist,
        x,
        y,
        z,
        minFOV,
        maxFOV
        );
    interp.setCurrent();
}

function interpolateFOV( f0, alpha, f1, beta)
{
    return (Math.atan(1.0 / ((alpha / Math.tan(f0*DEG_TO_RAD)) +
                                    (beta  / Math.tan(f1*DEG_TO_RAD)))) / DEG_TO_RAD);
}

function adjustOnCxCy( camera, targetPosition, position, cx, cy, theta, phi, dist, fov )
{
    var right = new Vector3( Math.cos(-theta), 0, -Math.sin(-theta) );
    right.normalize();
    var up = new Vector3( Math.sin(-theta)*Math.sin(-phi), Math.cos(-phi), Math.sin(-phi)*Math.cos(-theta) );
    up.normalize();
    var delta = dist*Math.tan( fov/2 );
    var deltaR = -2*delta*(cx-0.5);
    var deltaU = 2*delta*(cy-0.5);
    targetPosition.addScaledInPlace( up, deltaU );
    targetPosition.addScaledInPlace( right, deltaR );
    position.addScaledInPlace( up, deltaU );
    position.addScaledInPlace( right, deltaR );
    if ( COMPENSATE_BY_OBJECT_ROTATION )
    {
        var rootTheta = fov*(cx-0.5)/Math.PI*180.0;
        var rootPhi = -fov*(cy-0.5)/Math.PI*180.0;
        OBJECT["ROOT"].apply( null, targetPosition , new Vector3( rootTheta, rootPhi, 0 ), null, 0.0 );
    }
}

// The method is called from the toolbar only
function moveView( stepX, stepY )
{
    var view = new View();
    view.getCameraPosition();
    view.cx += stepX;
    view.cy += stepY;
    setCameraMotionGoal(view);
}

// The method is called from the toolbar only
function rotateView( dTheta, dPhi )
{
    var view = new View();
    view.getCameraPosition();
    view.theta += dTheta;
    if ( Math.abs(view.phi+dPhi) < 90 )
        view.phi += dPhi;
    setCameraMotionGoal(view);
}

function rotateViewByMouse( dx, dy )
{
    var theta = startDragView.theta-360*dx; // Increase this coefficient to speed-up rotation
    var phi = startDragView.phi-180*dy; // Increase this coefficient to speed-up rotation
    if ( phi > 89.9 )
        phi = 89.9;
    else
        if ( phi < -89.9 )
            phi = -89.9;
    if ( GOAL_VIEW==null )
    {
        var view = new View();
        view.getCameraPosition();
        view.theta = theta;
        view.phi = phi;
        setCameraMotionGoal(view);
    }
    else
    {
        GOAL_VIEW.theta = theta;
        GOAL_VIEW.phi = phi;
        CAMERA_MOTION_START_TIME = CURRENT_TIME;
        CAMERA_MOTION_LAST_TIME = CAMERA_MOTION_START_TIME;
    }
}

// The method is called from the mouse handler
function moveViewByMouse( stepX, stepY )
{
    var cx = startDragView.cx+stepX;
    var cy = startDragView.cy+stepY;
    if ( GOAL_VIEW==null )
    {
        var view = new View();
        view.getCameraPosition();
        view.cx = cx;
        view.cy = cy;
        setCameraMotionGoal(view);
    }
    else
    {
        GOAL_VIEW.cx = cx;
        GOAL_VIEW.cy = cy;
    }
}

// The method is called from the mouse handler
function zoomViewByMouse( zoomFactor )
{
    if ( zoomFactor==0 ) return;
    if ( zoomFactor < 0 ) // Zoom
    {
        var limit = startDragView.minFOV;
        if (!LIMIT_ZOOM)
            limit = 0;
        var fov = Math.max(startDragView.fov*Math.max(1+zoomFactor,0.1),limit);
    }
    else
    {
        var limit = startDragView.maxFOV;
        if (!LIMIT_ZOOM)
            limit = 180;
        var fov = Math.min(startDragView.fov*1/Math.max(1-zoomFactor,0.1),limit);
    }
    if ( GOAL_VIEW==null )
    {
        var view = new View();
        view.getCameraPosition();
        view.fov = fov;
        setCameraMotionGoal(view);
    }
    else
    {
        GOAL_VIEW.fov = fov;
    }
}

function restoreCameraTheta()
{
    while (CAMERA.theta>360.0) CAMERA.theta -= 360.0;
    while (CAMERA.theta<0.0) CAMERA.theta += 360.0;
}
/***************************************/
/*        M A T E R I A L              */
/***************************************/
var MATERIAL = new Array();
var tempMatrix = new Matrix4x4();
var MIN_EHL_COLOR_BRIGHTNESS = 0.2;

function Material(
    id,
    desc,
    color,
    image,
    ambient,
    diffuse,
    specular,
    glossiness,
    chrome,
    light,
    alpha,
    hasAlphaChannel
    )
{
    this.id = id;
    this.desc = desc;
    this.color = color;
    this.image = image;
    this.ambient = ambient;
    this.diffuse = diffuse;
    this.specular = specular;
    this.glossiness = glossiness;
    this.chrome = chrome;
    this.light = light;
    this.alpha = alpha;
    this.hasAlphaChannel = hasAlphaChannel;
    if ( light=="phong" )
    {
        this.specularStrength = (1+Math.exp(-chrome))*specular ;  // Just an empirical coefficient
        var phongExponent = (1+2*Math.exp(-chrome))*shininess(glossiness); // Just an empirical coefficient
        var specularColor = 1.0;
        setMaterialSpecularProperties(id,phongExponent,this.specularStrength,specularColor);
    }
    if ( alpha<1.0 )
        setMaterialAlpha( id, alpha  );
}

Material.prototype.setOpacity = function( alpha )
{
    var material = scene.materials.getByName( this.id );
    if ( material==undefined ) return;
    material.opacity = this.alpha*alpha;
}

function copyColor( fromID, toID )
{
    copyColor2( fromID, fromID, 0, toID );
    refreshNodeMaterials();
}

function copyColor2( fromID, fromID2, p, toID )
{
    var ehl = isEHLMaterial( toID );
    var material = scene.materials.getByName( toID );
    if ( material==undefined )
    {
        console.println("Undefined material "+toID);
        return;
    }
    var from = scene.materials.getByName( fromID );
    if ( from==undefined )
    {
        console.println("Undefined material "+fromID);
        return;
    }
    var from2 = scene.materials.getByName( fromID2 );
    if ( from2==undefined )
    {
        console.println("Undefined material "+fromID2);
        return;
    }
    copyColorP( material, from, from2, p, ehl, fromID );
    MATERIAL[toID].alpha = MATERIAL[fromID].alpha*(1-p)+MATERIAL[fromID2].alpha*p;
// If material has been splitted to support smooth fading, we have to set color of all material's copies as well
    if ( toID.indexOf("clone_") == 0 ) return; // Don't check up clone for its clones
    for( var m=0; m<scene.materials.count; m++ )
    {
        var mat = scene.materials.getByIndex(m);
        if ( mat.name.indexOf("clone_"+toID+"_")==0 || mat.name.indexOf("clone_clone_"+toID+"_")==0)
            copyColor2( fromID, fromID2, p, mat.name );
    }
}

function copyColorP( material, from, from2, p, ehl, fromID )
{
    var p2 = p;
    p = 1 - p;
    material.ambientColor.r = from.ambientColor.r*p+from2.ambientColor.r*p2;
    material.ambientColor.g = from.ambientColor.g*p+from2.ambientColor.g*p2;
    material.ambientColor.b = from.ambientColor.b*p+from2.ambientColor.b*p2;
    if ( ehl )
    {
        {
            var fromAmbientLevel = MATERIAL[fromID].ambient;
            material.ambientColor.r /= fromAmbientLevel;
            material.ambientColor.g /= fromAmbientLevel;
            material.ambientColor.b /= fromAmbientLevel;
        }
        material.diffuseColor.r = 0;
        material.diffuseColor.g = 0;
        material.diffuseColor.b = 0;
        material.specularColor.r = 0;
        material.specularColor.g = 0;
        material.specularColor.b = 0;
        material.specularStrength = 0;
        material.emissiveColor.r = from.ambientColor.r/fromAmbientLevel;
        material.emissiveColor.g = from.ambientColor.g/fromAmbientLevel;
        material.emissiveColor.b = from.ambientColor.b/fromAmbientLevel;
        correctEHLMaterialBrightness( material );
    }
    else
    {
        material.diffuseColor.r = from.diffuseColor.r*p+from2.diffuseColor.r*p2;
        material.diffuseColor.g = from.diffuseColor.g*p+from2.diffuseColor.g*p2;
        material.diffuseColor.b = from.diffuseColor.b*p+from2.diffuseColor.b*p2;
        material.emissiveColor.r = from.emissiveColor.r*p+from2.emissiveColor.r*p2;
        material.emissiveColor.g = from.emissiveColor.g*p+from2.emissiveColor.g*p2;
        material.emissiveColor.b = from.emissiveColor.b*p+from2.emissiveColor.b*p2;
        material.specularColor.r = from.specularColor.r*p+from2.specularColor.r*p2;
        material.specularColor.g = from.specularColor.g*p+from2.specularColor.g*p2;
        material.specularColor.b = from.specularColor.b*p+from2.specularColor.b*p2;
        material.specularStrength = from.specularStrength*p+from2.specularStrength*p2;
    }
    material.opacity = from.opacity*p+from2.opacity*p2;
    material.phongExponent = from.phongExponent*p+from2.phongExponent*p2;
}

function refreshNodeMaterials()
{
    if ( runtime.getRendererName()=="Software")
    {   // This is a workaround of software renderer bug.
        // It does not apply material's color to the node until its transform matrix changes.
        for( var obj=0; obj<scene.nodes.count; obj++)
        {
            var node = scene.nodes.getByIndex(obj);
            if ( node==undefined ) continue;
            if ( node.name.indexOf("_ehl")!=-1 ) continue; // Not necessary to do this on EHLs
            tempMatrix.setIdentity();
            tempMatrix.scaleInPlace(1.00001,1.0000,1.0000);
            tempMatrix.multiplyInPlace(node.transform);
            node.transform.set(tempMatrix);
         }
    }
}

function shininess(glossiness)
{
    if (glossiness>=0.95) return 128.0;
    var s = 128.0*Math.log(0.95 - glossiness)/(-3.0*Math.log(50.0));
    if (s<0.0) s = 0.0;
    if ( s > 128.0 ) s = 128.0;
    return s;
}

function setMaterialSpecularProperties( mat, phongExponent, specularStrength, specularColor  )
{
    var material = scene.materials.getByName( mat );
    if ( material==undefined ) return;
    material.phongExponent = phongExponent;
    material.specularStrength = specularStrength;
    material.specularColor.r = specularColor;
    material.specularColor.g = specularColor;
    material.specularColor.b = specularColor;
}

function setMaterialAlpha( mat, alpha  )
{
    var material = scene.materials.getByName( mat );
    if ( material==undefined ) return;
    material.opacity = alpha;
}

function isEHLMaterial( mat )
{
    for( var ehl in EHLs )
    {
        var ehlMat = OBJECT_MATERIALS[ehl+"#0"][0];
        if ( ehlMat==mat ) return true;
    }
    return false;
}

function correctEHLMaterialBrightness( material )
{
    var r = material.emissiveColor.r;
    var g = material.emissiveColor.g;
    var b = material.emissiveColor.b;
    var Y = 0.299*r + 0.587*g + 0.114*b;
    var U = -0.16875*r - 0.33126*g + 0.5*b;
    var V = 0.5*r - 0.41869*g - 0.08131*b;
    Y += MIN_EHL_COLOR_BRIGHTNESS*Math.exp(-10*Y);
    material.emissiveColor.r = Y + 1.402*V;
    material.emissiveColor.g = Y - 0.34413*U - 0.71414*V;
    material.emissiveColor.b = Y + 1.772*U;
}

// Workaround of 7.0.7 version bug, it doesn't handle properly attenuation of a point light
if ( runtime.version>="7.07")
{
    for( var j=0; j<scene.lights.count; j++)
    {
        scene.lights.getByIndex(j).attenuationType="none";
    }
}
    var MILLIMETER = 1000.0;
    var OBJECT2D = new Array();
    OBJECT2D[0] = new Object2D( "u1639b7d6-1006", "$$$MeasureMark", "$$$MeasureMark", 0.045451153, 0.045451153, 20, 20, false, true );
    OBJECT2D[1] = new Object2D( "u1639b7d6-1007", "$$$MeasureMark", "$$$MeasureMark", 0.045451153, 0.045451153, 20, 20, false, true );
    OBJECT["__SCENE__"] = new Obj("","__SCENE__","__SCENE__",new Vector3(0.0,0.0,0.0),new Vector3(0.0,0.0,0.0),new Vector3(0.0,0.0,0.0));
    OBJECT["u1639b7d6-1004"] = new Obj("__SCENE__","u1639b7d6-1004","u1639b7d6-1004",new Vector3(0.0,0.0,0.0),new Vector3(0.0,0.0,0.0),new Vector3(0.0,0.0,0.0));
    OBJECT["ROOT"] = new Obj("u1639b7d6-1004","ROOT","ROOT",new Vector3(0.0,0.0,0.0),new Vector3(0.0,0.0,0.0),new Vector3(0.0,0.0,0.0));
    OBJECT_MATERIALS["ROOT"] = ["mat2",];
    OBJECT["u1639b7d6-1006"] = new Obj("__SCENE__","u1639b7d6-1006","u1639b7d6-1006",new Vector3(0.0,0.0,0.0),new Vector3(0.0,0.0,0.0),new Vector3(0.0,0.0,0.0));
    OBJECT_MATERIALS["u1639b7d6-1006"] = ["$$$MeasureMark",];
    OBJECT["u1639b7d6-1007"] = new Obj("__SCENE__","u1639b7d6-1007","u1639b7d6-1007",new Vector3(0.0,0.0,0.0),new Vector3(0.0,0.0,0.0),new Vector3(0.0,0.0,0.0));
    OBJECT_MATERIALS["u1639b7d6-1007"] = ["$$$MeasureMark",];

    MATERIAL["$$$MeasureMark"] = new Material( "$$$MeasureMark","$$$MeasureMark",null,"$$$MeasureMark",1.0,1.0,0.0,0.0,0.0,"none",1.0,false);
    MATERIAL["mat0"] = new Material( "mat0","mat0","000000",null,0.2,1.0,0.089726,0.9204249,0.0,"phong",1.0,false);
    MATERIAL["mat1"] = new Material( "mat1","mat1","000000",null,0.0,1.0,0.0,0.0,0.0,"none",1.0,false);
    MATERIAL["mat2"] = new Material( "mat2","mat2",null,"texture_1_1.jpg",0.2,1.0,0.075,0.9204249,0.03,"phong",1.0,false);

    var VIEW = new Array();
    init = VIEW["init"] = new View("init","Initial",0.0,0.0,0.5,0.5,28.0001,27.344093,-0.33677113,0.8152573,0.37617278,6.667,28.0001);

    var SEQUENCE = new Array(1);

    var seq_0_SUB = new Array();
    var seq_0_WP = new Array(2);
    seq_0_WP[0] = new Waypoint("show",0.0,"Show",null,null,null,1.0,null);
    seq_0_WP[1] = new Waypoint("hide",1.0,"Hide",null,null,null,0.0,null);
    seq_0 = SEQUENCE["seq_0"] = new Sequence("","seq_0","Fade ROOT","ROOT",null,seq_0_WP);

    var INIT_SCRIPT_NAME = "init";
    var SCRIPT = new Array(2);

    var init_AT = new Array(3);
      init_AT[0] = new At( 0.0, null, "u1639b7d6_1008", 0.0, null, null, null, null, 0);
    VIEW["0"] = new View("0","0",0.0,0.0,0.5,0.5,28.0001,27.344093,-0.33677113,0.8152573,0.37617278,6.667,28.0001);
      init_AT[1] = new At( 0.0, "0", null, 0.0, null, null, null, null, 0);
      init_AT[2] = new At( 0.016667, null, "seq_0", 0.0, null, null, null, null, 0);
    init = SCRIPT["init"] = SCRIPT["Init"] = new Script( "init", "Init", false, null, null, null, null, init_AT );

    var HOTSPOT_INITIAL_RADIUS = 0.13635346
    var HOTSPOT_VISIBLE_RADIUS = 1.9999999552965164
runtime.addCustomMenuItem(MSG_MEASURE_IN_INCHES,MSG_MEASURE_IN_INCHES,"default",false);
runtime.addCustomMenuItem(MSG_MEASURE_IN_CENTIMETERS,MSG_MEASURE_IN_CENTIMETERS,"default",false);

/***************************************/
/*             M E N U                 */
/***************************************/
    var MENU_SCRIPT = new Array();
    var MENU_TOOLTIP = new Array();
 
    runtime.addCustomMenuItem('Reset','Reset',"default",false);
    MENU_SCRIPT[0] = MENU_SCRIPT['Reset'] = [ "init" ];
    MENU_ITEM_NAME[0] = 'Reset';
    MENU_TOOLTIP[0] = MENU_TOOLTIP['Reset'] = [ "Reset" ];
    OBJECT2D[0].setVisibleUncond(false);
    OBJECT2D[1].setVisibleUncond(false);
    if ( OBJECT2D!=undefined )
        for( j=0; j<OBJECT2D.length; j++)
            if ( OBJECT2D[j].isActive() ) OBJECT2D[j].setVisible(true);

    runtime.addCustomMenuItem("About Strata...","About Strata...","default",false);
    SCRIPT[INIT_SCRIPT_NAME].jumpToEnd();
    updateEHLs();

// Total Statistics
var OBJECTS_COUNT = 5;
var TRIANGLE_COUNT = 7517;
var TEXTURE_COUNT = 2;
var TOTAL_TEXTURE_SIZE = 4194704;

