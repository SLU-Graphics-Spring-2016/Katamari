var camera, scene, renderer;
var geometry, material, mesh;
var controls;

var objects = [];

var raycaster;

var controlsEnabled = false;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var player;
var exterior;
var raycastReference;
var curCamZoom = 70;
var DEFAULT_FORWARD_SPEED = 60;
var DEFAULT_BACKWARD_SPEED = 60;

var localXaxis = new THREE.Vector3(1, 0, 0);
var localYaxis = new THREE.Vector3(0, 1, 0);
var localZaxis = new THREE.Vector3(0, 0, 1);

var prevTime = performance.now();
var velocity = new THREE.Vector3();

var element = document.body;

controlsEnabled = true;

var fullscreenchange = function ( event ) {
    if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
        document.removeEventListener( 'fullscreenchange', fullscreenchange );
        document.removeEventListener( 'mozfullscreenchange', fullscreenchange );    
    }
};

document.addEventListener( 'fullscreenchange', fullscreenchange, false );
document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
element.requestFullscreen();


function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

    // Add player object
    //added sample texture to try to work on simulating the ball actually rolling
    var normap = new THREE.TextureLoader().load("BlackMarble.png");

    player = new THREE.Object3D();
	
	var extG = new THREE.SphereGeometry(10, 32, 32);
	var extMat = new THREE.MeshPhongMaterial({color :0x0066ff, shininess : 100, normalMap: normap });
	var exterior = new THREE.Mesh(extG, extMat);
	player.add(exterior);
	
	raycastReference = new THREE.Object3D();
	scene.add(raycastReference);
	
	//Attach the camera to lock behind the ball
	raycastReference.add(camera);
	// console.log(player);
	//Current zoom of the camera behind the ball
	camera.position.z = curCamZoom;
	camera.position.y += 10;
	
    player.velocity = new THREE.Vector3();
	player.forwardSpeed = DEFAULT_FORWARD_SPEED;
	player.backwardSpeed = DEFAULT_BACKWARD_SPEED;
	setupCollisions(raycastReference);
	
    scene.add(player);
    
    var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
    light.position.set( 0.5, 1, 0.75 );
    scene.add( light );

	//May not be needed once modified cam controls exist
    controls = new THREE.PointerLockControls( player );
    
    scene.add( controls.getObject() );

	//************************ KEY COMMANDS ***********************************
	//*************************************************************************
	
    var onKeyDown = function ( event ) {

        switch ( event.keyCode ) {

        //NOTE: do we want to have the arrow keys function as camera controls?
        
            case 38: // up
            case 87: // w
                //if currently moving backwards, sets velocity to 0 so that you immediately switch directions
                moveForward = true;

                // player.material.rotateZ(10);
                break;

            case 37: // left
            case 65: // a
                moveLeft = true; 
                // player.rotation.y += .05;
				break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                //if currently moving forward, sets velocity to 0 so that you immediately switch directions
                
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                // player.rotation.y -= .05;
                break;

            case 32: // space
                if ( canJump === true ) velocity.y += 350;
                canJump = false;
                break;

        }
    };

	//Setting the player.xSpeed resets player movement
    var onKeyUp = function ( event ) {

        switch( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;

        }

    };
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

	
    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

    
	//Create the floor
    geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
    geometry.rotateX( - Math.PI / 2 );

    for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {

        var vertex = geometry.vertices[ i ];
        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 2;
        vertex.z += Math.random() * 20 - 10;

    }

    for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

        var face = geometry.faces[ i ];
        face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

    }

    material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

	//************************ OBJECTS ****************************************
	//*************************************************************************
	
    geometry = new THREE.BoxGeometry( 20, 20, 20 );

    for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

        var face = geometry.faces[ i ];
        face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

    }

    for ( var i = 0; i < 50; i ++ ) {

        material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );

        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
        mesh.position.y = 10;
        mesh.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;
        scene.add( mesh );

        material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

        objects.push( mesh );

    }

    
	//Setup the renderer and attach it to the page
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xffffff );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    //Setup window resize

    window.addEventListener( 'resize', onWindowResize, false );

}

//Thanks to: http://webmaestro.fr/collisions-detection-three-js-raycasting/
function setupCollisions(item) {
	item.mesh = item;
	item.rays = [
		new THREE.Vector3(0, 0, 1),
		new THREE.Vector3(1, 0, 1),
		new THREE.Vector3(1, 0, 0),
		new THREE.Vector3(1, 0, -1),
		new THREE.Vector3(0, 0, -1),
		new THREE.Vector3(-1, 0, -1),
		new THREE.Vector3(-1, 0, 0),
		new THREE.Vector3(-1, 0, 1)
	];
	
	item.caster = new THREE.Raycaster();
	
	item.collision = function () {
		//TODO: setup so that distance grows relative to ball size
		var collisions, i, distance = 10;
		for (i = 0; i < this.rays.length; i++) {
			this.caster.set(this.position, this.rays[i]);
			collisions = this.caster.intersectObjects(objects);
			
			// console.log(this.rays[i]);
			if (collisions.length > 0 && collisions[0].distance <= distance) {
                //removed all conditions because all collisions will reverse z velocity
                //sometimes gets stuck inside objects and ricochets against interior walls
				
				//TODO: temporarily removed, currently adds any object to ball
                // player.velocity.z = -player.velocity.z;
				//TODO: make offset relative to ray distance as ball grows

                // collisions[0].object.updateMatrix();
                // collisions[0].object.updateMatrixWorld();
				// player.children[0].updateMatrix();
				// player.children[0].updateMatrixWorld();
				
				// collisions[0].object.matrixAutoUpdate = false;
				
				removeFromObjects(collisions[0].object);
                
				// collisions[0].object.position.set(player.children[0].position.x, player.children[0].position.y, player.children[0].position.z);
				// collisions[0].object.setRotationFromQuaternion(player.children[0].quaternion);
				// console.log(collisions[0].object.position.x);
                // console.log(objects);
                // var m = new THREE.Matrix4();
                // m.getInverse(player.children[0].matrixWorld);
                
                // console.log(player.children[0].matrixWorld);
                // console.log(collisions[0].object.matrix);
                // console.log(m);
				// console.log(collisions);
				// console.log(collisions[0].object.position);
				
				var obV = new THREE.Vector3();
				obV.setFromMatrixPosition(collisions[0].object.matrixWorld);
				var plV = new THREE.Vector3();
				plV.setFromMatrixPosition(player.children[0].matrixWorld);
				player.children[0].worldToLocal(plV);
				player.children[0].worldToLocal(obV);
				
				// console.log(obV);
				obV.sub(plV);
				// console.log(obV);
				
				// .worldToLocal
				
				// var tx, ty, tz;
				// tx = player.children[0].rotation.x;
				// ty = player.children[0].rotation.y;
				// tz = player.children[0].rotation.z;
				
				// player.children[0].rotation.set(0, 0, 0);
				// player.children[0].updateMatrix();
				
				var obRot = new THREE.Matrix4();
				obRot.makeRotationFromQuaternion(player.children[0].quaternion);
				collisions[0].object.quaternion.setFromRotationMatrix(obRot);
                
                // collisions[0].object.matrix.multiply(m);
                // scene.remove(collisions[0].object);
                player.children[0].add(collisions[0].object);
				collisions[0].object.position.copy(obV);
				// player.children[0].rotation.set(tx, ty, tz);
				// console.log(collisions[0].object.position);
			}
		}
	};
	
};

function removeFromObjects(obj) {
	// console.log(obj);
	for (var i = 0; i < objects.length; i++) {
		
	// console.log(objects[i]);
		if (objects[i] === obj) {
			objects.splice(i, 1);
		}
	}
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    if ( controlsEnabled ) {
		raycastReference.collision();
		
        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;

        var intersections = raycaster.intersectObjects( objects );

        var isOnObject = intersections.length > 0;

        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;
		
        player.velocity.z -= player.velocity.z * delta;
        player.velocity.x -= player.velocity.x * delta;
        // player.velocity.x -= player.velocity.x * delta;
        
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
		
        //this is what updates the velocity
		if (moveForward) {
				if(player.velocity.z > 0 && moveBackward){
                    player.velocity.z = 0;
                }
                player.velocity.z -= 10;
				console.log(camera);
		}
		if (moveBackward) {
			if(player.velocity.z < 0 && moveForward){
                    player.velocity.z = 0;
                }
                player.velocity.z += 10;
		}
		
		// player.children[0].rotateX((player.velocity.z)/(Math.PI * 2 * 500));
		// player.children[0].rotateOnAxis(localZaxis, (player.velocity.z)/(Math.PI * 2 * 500));
		// player.children[0].rotateOnAxis(localXaxis, -(player.velocity.x)/(Math.PI * 2 * 500));
        // player.children[0].rotateZ(-(player.velocity.x)/(Math.PI * 2 * 500));
		rotateAroundWorldAxis(player.children[0], localXaxis, (player.velocity.z)/(Math.PI * 2 * 500));
		rotateAroundWorldAxis(player.children[0], localZaxis, (player.velocity.x)/(Math.PI * 2 * 500));
		
        player.translateX(-player.velocity.x * delta);
		player.translateZ(player.velocity.z * delta);

		if ( moveLeft ) {
            if(player.velocity.x < 0 && moveRight){
                player.velocity.x = 0;
            }
            player.velocity.x += 5;
            
            player.rotation.y += .05;
			raycastReference.rotation.y += .05;
		}
		if ( moveRight ) {
            if(player.velocity.x > 0 && moveLeft){
                player.velocity.x = 0;
            }
            player.velocity.x -= 5;
            
            player.rotation.y -= .05;
			raycastReference.rotation.y -= .05;
		}

        if ( isOnObject === true ) {
            velocity.y = Math.max( 0, velocity.y );
            canJump = true;
        }

        // controls.getObject().translateX( player.velocity.x * delta );
        // controls.getObject().translateY( player.velocity.y * delta );
        // controls.getObject().translateZ( player.velocity.z * delta );

        if ( controls.getObject().position.y < 10 ) {

            velocity.y = 0;
            controls.getObject().position.y = 10;
            canJump = true;

        }
		
		raycastReference.position.set(player.position.x, player.position.y, player.position.z);
		
        prevTime = time;

    }
    renderer.render( scene, camera );

}

var rotObjectMatrix;
function rotateAroundObjectAxis(object, axis, radians) {
    rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    // object.matrix.multiplySelf(rotObjectMatrix);      // post-multiply
    // new code for Three.JS r55+:
    object.matrix.multiply(rotObjectMatrix);

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // old code for Three.js r50-r58:
    // object.rotation.setEulerFromRotationMatrix(object.matrix);
    // new code for Three.js r59+:
    object.rotation.setFromRotationMatrix(object.matrix);
}

var rotWorldMatrix;
// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    //  rotWorldMatrix.multiply(object.matrix);
    // new code for Three.JS r55+:
    rotWorldMatrix.multiply(object.matrix);                // pre-multiply

    object.matrix = rotWorldMatrix;

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // old code for Three.js pre r59:
    // object.rotation.setEulerFromRotationMatrix(object.matrix);
    // code for r59+:
    object.rotation.setFromRotationMatrix(object.matrix);
}


init();
animate();