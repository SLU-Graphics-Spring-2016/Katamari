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
var curCamZoom = 30;
var DEFAULT_FORWARD_SPEED = 40;
var DEFAULT_BACKWARD_SPEED = 40;

var prevTime = performance.now();
var velocity = new THREE.Vector3();

var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );

// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if ( havePointerLock ) {

    var element = document.body;

    var pointerlockchange = function ( event ) {

        if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

            controlsEnabled = true;
            controls.enabled = true;

            // blocker.style.display = 'none';

        } else {

            controls.enabled = false;

            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';

            // instructions.style.display = '';

        }

    };

    var pointerlockerror = function ( event ) {

        // instructions.style.display = '';

    };

	//Comment this out to remove mouse controls for now
    // Hook pointer lock state change events
    // document.addEventListener( 'pointerlockchange', pointerlockchange, false );
    // document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
    // document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

    document.addEventListener( 'pointerlockerror', pointerlockerror, false );
    document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
    document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

    document.addEventListener( 'click', function ( event ) {

        // instructions.style.display = 'none';
		
		//Once screen is selected, interaction begins
		controlsEnabled = true;

        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

        if ( /Firefox/i.test( navigator.userAgent ) ) {

            var fullscreenchange = function ( event ) {

                if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

                    document.removeEventListener( 'fullscreenchange', fullscreenchange );
                    document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

                    // element.requestPointerLock();
					
                }

            };

            document.addEventListener( 'fullscreenchange', fullscreenchange, false );
            document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

            element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

            element.requestFullscreen();

        } else {

            element.requestPointerLock();

        }

    }, false );

} else {

    // instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

}

function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

        // Add player object
    var playerGeo = new THREE.SphereGeometry(10,32,32);
    var playerMesh = new THREE.MeshPhongMaterial({ color: 0x990011, specular: 0x2222cc });
    player = new THREE.Mesh(playerGeo, playerMesh);
	
	//Attach the camera to lock behind the ball
	player.add(camera);
	//Current zoom of the camera behind the ball
	camera.position.z = curCamZoom;
	
	player.forwardSpeed = DEFAULT_FORWARD_SPEED;
	player.backwardSpeed = DEFAULT_BACKWARD_SPEED;
	
	setupCollisions(player);
	
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

            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true; 
				break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
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
				player.forwardSpeed = DEFAULT_FORWARD_SPEED;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
				player.backwardSpeed = DEFAULT_BACKWARD_SPEED;
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

    for ( var i = 0; i < 500; i ++ ) {

        material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );

        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
        mesh.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
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
		var collisions, i, distance = 10, obstacles = objects;
		for (i = 0; i < this.rays.length; i++) {
			this.caster.set(this.mesh.position, this.rays[i]);
			collisions = this.caster.intersectObjects(obstacles);
			
			//This is like the most important line of code I've ever written
			//It turns the rays based on the objects rotation
			this.rays[i].applyQuaternion(this.quaternion);
			
			if (collisions.length > 0) {
				// console.log(collisions[0].distance);
			}
			console.log(this.rays[i]);
			if (collisions.length > 0 && collisions[0].distance <= distance) {
				  // Yep, this.rays[i] gives us : 0 => up, 1 => up-left, 2 => left, ...
				if ((i === 0 || i === 1 || i === 7) && moveBackward) {
								console.log(i);

					// this.direction.setZ(0);
					// moveForward = false;
					player.backwardSpeed = 0;
					console.log("back collide");
				} else if ((i === 3 || i === 4 || i === 5) && moveForward) {
								console.log(i);

					// this.direction.setZ(0);
					// moveBackward = false;
					
					//this one doesnt seem to work for some reason
					console.log("front collide");
					player.forwardSpeed = 0;
				}
				// if ((i === 1 || i === 2 || i === 3) && this.direction.x === 1) {
					// // this.direction.setX(0);
				// } else if ((i === 5 || i === 6 || i === 7) && this.direction.x === -1) {
					// // this.direction.setX(0);
				// }
			}
		}
	};
	
};

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    if ( controlsEnabled ) {
		player.collision();
		
        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;

        var intersections = raycaster.intersectObjects( objects );

        var isOnObject = intersections.length > 0;

        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        // if ( moveForward ) velocity.z -= 400.0 * delta;
        // if ( moveBackward ) velocity.z += 400.0 * delta;
		// console.log(player.forwardSpeed);
		// console.log(player.backwardSpeed);
		
		if ( moveForward ) player.translateZ(player.forwardSpeed * -delta);
		if ( moveBackward ) player.translateZ(player.backwardSpeed * delta);

        // if ( moveLeft ) velocity.x -= 400.0 * delta;
        // if ( moveRight ) velocity.x += 400.0 * delta;
		if ( moveLeft ) player.rotateY(.05);
		if ( moveRight ) player.rotateY(-.05);

        if ( isOnObject === true ) {
            velocity.y = Math.max( 0, velocity.y );

            canJump = true;
        }

        controls.getObject().translateX( velocity.x * delta );
        controls.getObject().translateY( velocity.y * delta );
        controls.getObject().translateZ( velocity.z * delta );

        if ( controls.getObject().position.y < 10 ) {

            velocity.y = 0;
            controls.getObject().position.y = 10;

            canJump = true;

        }

        prevTime = time;

    }

    renderer.render( scene, camera );

}

init();
animate();

