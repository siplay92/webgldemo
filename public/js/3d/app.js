var sceneDomElement = $('#sceneDomElement');
var sceneDomElementWidth = parseInt(sceneDomElement.css('width'), 10);
var sceneDomElementHeight = parseInt(sceneDomElement.css('height'), 10);
var chatElement = $('.chat-container');
var currentPlayerName = $('#player-name').text();
$('#blocker').css({
    'width': sceneDomElement.css('width'),
    'height': sceneDomElement.css('height')
});
$('body').css('background', 'none');

var controls = null;
var raycaster = null;
var velocitySpeed = 1;

var chatIsActive = false;

var prevPlayerPosX = 0;
var prevPlayerPosY = 0;
var prevPlayerPosZ = 0;
var prevPlayerPosRotX = 0;
var prevPlayerPosRotY = 0;
var prevPlayerPosRotZ = 0;

var objects = [];
var playersOnline = new Array();
var cubes = new Array();

var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();

$('#message-send-form').submit(function (event) {
    if (!chatIsActive) {
        messageText = $('input[name="message-text"]');
        if (messageText.val() != "") {
            socket.send({'message': messageText.val(), 'login': currentPlayerName});
            messageText.val('');
            messageText.blur();
        }
    }
    event.preventDefault();
});

socket.on('message', function (msg) {
    message = $("<div>", {"class": "message"});
    message.html(strings[msg.event].replace(/\[([a-z]+)\]/g, '<span class="$1">').replace(/\[\/[a-z]+\]/g, '</span>').replace(/\%time\%/, msg.time).replace(/\%name\%/, msg.name).replace(/\%text\%/, unescape(msg.text).replace('<', '&lt;').replace('>', '&gt;')) + '<br>');
    if (msg.name == currentPlayerName) {
        message.css('color', 'yellow');
    }
    chatMessageContainter = $('.chat-message-container');

    message.appendTo(chatMessageContainter);
    if (chatMessageContainter.find('.message').length > 50)
        chatMessageContainter.find('.message')[0].remove();
    chatMessageContainter.scrollTop(chatMessageContainter.height());
});

socket.on('playerPosChange', function (data) {
    scene.getObjectByName(data.login).position.x = data.x;
    scene.getObjectByName(data.login).position.y = data.y;
    scene.getObjectByName(data.login).position.z = data.z;
    scene.getObjectByName(data.login).rotation.x = data.rotX;
    scene.getObjectByName(data.login).rotation.y = data.rotY;
    scene.getObjectByName(data.login).rotation.z = data.rotZ;
});

socket.on('newPlayerEnteredGame', function (data) {
    var geometry = new THREE.SphereGeometry(10, 10, 256);
    var material = new THREE.MeshLambertMaterial({color: data.color});
    var sphere = new THREE.Mesh(geometry, material);
    sphere.position.x = data.x;
    sphere.position.y = data.y;
    sphere.position.z = data.z;
    sphere.rotation.x = data.rotX;
    sphere.rotation.y = data.rotY;
    sphere.rotation.z = data.rotZ;
    sphere.name = data.login;
    scene.add(sphere);
});

socket.on('playerExitGame', function (data) {
    scene.remove(scene.getObjectByName(data.login));
    app.animate();
});

var app = {
    SCREEN_WIDTH: sceneDomElementWidth,
    SCREEN_HEIGHT: sceneDomElementHeight,
    VIEW_ANGLE: 75,
    NEAR: 0.1,
    FAR: 10000,
    camera: null,
    scene: null,
    renderer: null,
    geometry: null,
    material: null,
    mesh: null,
    anisotropy: null,
    init: function () {
        app.createScene();
        app.addAxes();
        app.createControlsCamera();
        app.createLight();
        app.getSceneElementsPositions();
        app.loadModel();
        app.initRenderer();
        app.setPersonPosition();
        app.createWater();
        app.setResizable();
        app.createOnlinePlayers();
        app.addKeysListener();
        app.animate();
    },
    createScene: function () {
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0xffffff, 0, 1500);
    },
    createControlsCamera: function () {
        camera = new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.SCREEN_WIDTH / this.SCREEN_HEIGHT, this.NEAR, this.FAR);
        controls = new THREE.PointerLockControls(camera);
        scene.add(controls.getObject());
        raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
    },
    initRenderer: function () {
        renderer = new THREE.WebGLRenderer({antialias: true, precision: 'highp'});
        anisotropy = renderer.getMaxAnisotropy();
        renderer.setClearColor(0xffffff,1);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        //renderer.shadowMapEnabled = true;
        //renderer.shadowMapSoft = true;
        sceneDomElement.append(renderer.domElement);
    },
    getSceneElementsPositions: function () {
        socket.json.emit('getSceneElementsPositions');
        socket.on('response_getSceneElementsPositions', function (data) {
            cubes = data;
            app.createSceneElements();
        });
    },
    setPersonPosition: function () {
        socket.json.emit('getPlayerPosition', {'login': currentPlayerName});
        socket.on('response_getPlayerPosition', function (data) {
            prevPlayerPosX = data.x;
            prevPlayerPosY = data.y;
            prevPlayerPosZ = data.z;
            prevPlayerPosRotX = data.rotX;
            prevPlayerPosRotY = data.rotY;
            prevPlayerPosRotZ = data.rotZ;
            controls.getObject().position.x = data.x;
            controls.getObject().position.y = data.y;
            controls.getObject().position.z = data.z;
            controls.getObject().rotation.x = data.rotX;
            controls.getObject().rotation.y = data.rotY;
            controls.getObject().rotation.z = data.rotZ;
        });
    },
    createLight: function () {
        var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
        light.position.set( 0.5, 1, 0.75 );
        scene.add( light );
    },
    createOnlinePlayers: function () {
        socket.json.emit('getPlayersOnline');
        socket.on('response_getPlayersOnline', function (data) {
            playersOnline = data;
            //console.log(playersOnline);
            jQuery.each(playersOnline, function (i, player) {
                if (player.login != currentPlayerName) {
                    var geometry = new THREE.SphereGeometry(10, 10, 256);
                    var material = new THREE.MeshLambertMaterial({color: player.color});
                    var sphere = new THREE.Mesh(geometry, material);
                    sphere.position.x = player.x;
                    sphere.position.y = player.y;
                    sphere.position.z = player.z;
                    sphere.rotation.x = player.rotX;
                    sphere.rotation.y = player.rotY;
                    sphere.rotation.z = player.rotZ;
                    sphere.name = player.login;
                    scene.add(sphere);
                }
            });
        });
    },
    createSceneElements: function () {
        // floor

        //geometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
        //geometry.rotateX(-Math.PI / 2);
        //
        //for (var i = 0, l = geometry.vertices.length; i < l; i++) {
        //
        //    var vertex = geometry.vertices[i];
        //    vertex.x += Math.random() * 20 - 10;
        //    vertex.y += Math.random() * 2;
        //    vertex.z += Math.random() * 20 - 10;
        //
        //}
        //
        //for (var i = 0, l = geometry.faces.length; i < l; i++) {
        //
        //    var face = geometry.faces[i];
        //    face.vertexColors[0] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
        //    face.vertexColors[1] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
        //    face.vertexColors[2] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
        //
        //}
        //
        //material = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors});
        //
        //mesh = new THREE.Mesh(geometry, material);
        ////mesh.receiveShadow = true;
        //scene.add(mesh);
        //
        // objects

        geometry = new THREE.BoxGeometry(20, 20, 20);

        for (var i = 0, l = geometry.faces.length; i < l; i++) {

            var face = geometry.faces[i];
            face.vertexColors[0] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
            face.vertexColors[1] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
            face.vertexColors[2] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);

        }
        for (var i = 0; i < cubes.length; i++) {

            material = new THREE.MeshPhongMaterial({
                specular: 0xffffff,
                shading: THREE.SmoothShading,
                vertexColors: THREE.VertexColors
            });

            var mesh = new THREE.Mesh(geometry, material);
            //mesh.castShadow = true;
            mesh.position.x = 500+cubes[i][0];
            mesh.position.y = cubes[i][1];
            mesh.position.z = -500+cubes[i][2];
            scene.add(mesh);

            material.color.setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75);

            objects.push(mesh);
        }
    },
    loadModel: function() {
        //var oLoader = new THREE.OBJLoader();
        //oLoader.load('/models/castle/castle.obj', function(object, materials) {
        //    // var material = new THREE.MeshFaceMaterial(materials);
        //    var material2 = new THREE.MeshLambertMaterial({ color: 0xa65e00 });
        //    object.traverse( function(child) {
        //        if (child instanceof THREE.Mesh) {
        //            // apply custom material
        //            child.material = material2;
        //            // enable casting shadows
        //            //child.castShadow = true;
        //            //child.receiveShadow = true;
        //        }
        //    });
        //
        //    object.position.x = 0;
        //    object.position.y = 0;
        //    object.position.z = 0;
        //    object.scale.set(1, 1, 1);
        //    scene.add(object);
        //});

        //prepare loader and load the model
        //var oLoader = new THREE.OBJMTLLoader();
        //oLoader.load('/models/castle/castle.obj', '/models/castle/castle.mtl', function(object) {
        //    object.position.x = 0;
        //    object.position.y = 0;
        //    object.position.z = 0;
        //    //object.scale.set(0.4, 0.6, 0.4);
        //    scene.add(object);
        //    object.name='castle';
        //    console.log(object);
        //    //arrMeshs = scene.getObjectByName('castle').children;
        //    //arrVertices=new Array();
        //    //$.each( arrMeshs, function( keyMesh, valueMesh ) {
        //    //    arrVectices=valueMesh.geometry.vertices;
        //    //    valueMesh.wireframe= true;
        //    //    //valueMesh.material.wireframe= true;
        //    //    $.each( arrVectices, function( keyVertice, valueVertice ) {
        //    //        arrVertices.push(valueVertice);
        //    //    });
        //    //});
        //    //console.log(arrVertices);
        //});

        //var oLoader = new THREE.OBJLoader();
        //oLoader.load('/models/castle/castle.obj', function(object, materials) {
        //    // var material = new THREE.MeshFaceMaterial(materials);
        //    var material2 = new THREE.MeshLambertMaterial({});
        //    object.traverse( function(child) {
        //        if (child instanceof THREE.Mesh) {
        //            // apply custom material
        //            child.material = material2;
        //            // enable casting shadows
        //            //child.castShadow = true;
        //            //child.receiveShadow = true;
        //        }
        //    });
        //
        //    object.position.x = 0;
        //    object.position.y = 0;
        //    object.position.z = 0;
        //    object.scale.set(10, 10, 10);
        //    scene.add(object);
        //    console.log(object);
        //});

        // prepare loader and load the model
        //var oLoader = new THREE.ColladaLoader();
        //oLoader.load('/models/trees/tree.dae', function(collada) {
        //
        //    var object = collada.scene;
        //    var skin = collada.skins[0];
        //
        //    object.position.x = 0;
        //    object.position.y = 0;
        //    object.position.z = 0;
        //    object.scale.set(10, 10, 10);
        //    object.updateMatrix();
        //    scene.add(object);
        //});


        //var oLoader = new THREE.JSONLoader();
        //oLoader.load('models/palm.js', function(geometry, materials) {
        //
        //    // get original materials
        //    var material = new THREE.MeshFaceMaterial(materials);
        //
        //    var mesh = new THREE.Mesh(geometry, material);
        //
        //    mesh.position.x = -50;
        //    mesh.position.y = -80;
        //    mesh.position.z = 0;
        //    mesh.scale.set(10, 10, 10);
        //    lesson6.scene.add(mesh);
        //});



    },
    createWater: function () {

    },
    addAxes: function () {
        var axes = new THREE.AxisHelper(1000);
        axes.position.x = 0;
        axes.position.z = 0;
        axes.position.y = 0;
        scene.add(axes);
    },
    addKeysListener: function () {
        var onKeyDownWithOutSpace = function (event) {
            switch (event.keyCode) {

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

                case 16: // shift
                    velocitySpeed = 2;
                    break;
            }
        };

        var onKeyDownEnter = function (event) {
            switch (event.keyCode) {
                case 13:
                    if (chatIsActive) {
                        chatIsActive = false;
                        document.removeEventListener('keydown', onKeyDownEnter, false);
                        document.addEventListener('keydown', onKeyDown, false);
                        chatElement.css('opacity', '0.5');
                    }
            }
        };

        var onKeyDown = function (event) {
            switch (event.keyCode) {

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
                    if (canJump === true) velocity.y += 350;
                    document.removeEventListener('keydown', onKeyDown, false);
                    document.addEventListener('keydown', onKeyDownWithOutSpace, false);
                    canJump = false;
                    setTimeout(removeListener, 700);
                    break;

                case 16: // shift
                    velocitySpeed = 2;
                    break;

                case 13:
                    if (chatIsActive) {
                        chatIsActive = false;
                        chatElement.css('opacity', '0.5');
                        document.addEventListener('keydown', onKeyDown, false);
                    }
                    else {
                        if ($('#input-send-message').val().length > 0) {
                            $('#message-send-form').submit();
                        }
                        chatIsActive = true;
                        chatElement.css('opacity', '1');
                        $('#input-send-message').focus();
                        document.removeEventListener('keydown', onKeyDown, false);
                        document.addEventListener('keydown', onKeyDownEnter, false);
                    }
                    break;

            }
        };

        var onKeyUp = function (event) {

            switch (event.keyCode) {

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

                case 16: // shift
                    velocitySpeed = 1;
                    break;

            }

        };

        $('#input-send-message').click(function () {
            chatIsActive = true;
            chatElement.css('opacity', '1');
            $('#input-send-message').focus();
            document.removeEventListener('keydown', onKeyDown, false);
            document.addEventListener('keydown', onKeyDownEnter, false);
        });

        function removeListener() {
            document.removeEventListener('keydown', onKeyDownWithOutSpace, false);
            document.addEventListener('keydown', onKeyDown, false);
        }

        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);
    },
    animate: function () {
        requestAnimationFrame(app.animate);

        if (controlsEnabled) {
            raycaster.ray.origin.copy(controls.getObject().position);
            raycaster.ray.origin.y -= 10;

            var intersections = raycaster.intersectObjects(objects);

            var isOnObject = intersections.length > 0;

            var time = performance.now();
            var delta = ( time - prevTime ) / 1000;

            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;

            velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

            if (moveForward) velocity.z -= 800.0 * delta * velocitySpeed;
            if (moveBackward) velocity.z += 800.0 * delta * velocitySpeed;

            if (moveLeft) velocity.x -= 800.0 * delta * velocitySpeed;
            if (moveRight) velocity.x += 800.0 * delta * velocitySpeed;

            if (isOnObject === true) {
                velocity.y = Math.max(0, velocity.y);

                canJump = true;
            }

            controls.getObject().translateX(velocity.x * delta);
            controls.getObject().translateY(velocity.y * delta);
            controls.getObject().translateZ(velocity.z * delta);

            if (controls.getObject().position.y < 35) {

                velocity.y = 0;
                controls.getObject().position.y = 35;

                canJump = true;

            }

            prevTime = time;

        }

        renderer.render(scene, camera);

        if ((prevPlayerPosX != controls.getObject().position.x) ||
            (prevPlayerPosY != controls.getObject().position.y) ||
            (prevPlayerPosZ != controls.getObject().position.z) ||
            (prevPlayerPosRotX != controls.getObject().rotation.x) ||
            (prevPlayerPosRotY != controls.getObject().rotation.y) ||
            (prevPlayerPosRotZ != controls.getObject().rotation.z)) {
            socket.json.emit('currentPlayerPosChange', {
                'login': currentPlayerName,
                'x': controls.getObject().position.x,
                'y': controls.getObject().position.y,
                'z': controls.getObject().position.z,
                'rotX': controls.getObject().rotation.x,
                'rotY': controls.getObject().rotation.y,
                'rotZ': controls.getObject().rotation.z
            });
            prevPlayerPosX = controls.getObject().position.x;
            prevPlayerPosY = controls.getObject().position.y;
            prevPlayerPosZ = controls.getObject().position.z;
            prevPlayerPosRotX = controls.getObject().rotation.x;
            prevPlayerPosRotY = controls.getObject().rotation.y;
            prevPlayerPosRotZ = controls.getObject().rotation.z;

            $('#coord-x').text('Координата по х:' + Math.round(controls.getObject().position.x));
            $('#coord-z').text('Координата по z:' + Math.round(controls.getObject().position.z));
            $('#coord-y').text('Координата по y:' + Math.round(controls.getObject().position.y));

        }
    },
    setResizable: function () {
        function onWindowResize() {
            $('#blocker').css({
                'width': sceneDomElement.css('width'),
                'height': sceneDomElement.css('height')
            });
            sceneDomElementWidth = parseInt(sceneDomElement.css('width'), 10);
            sceneDomElementHeight = parseInt(sceneDomElement.css('height'), 10);
            camera.aspect = sceneDomElementWidth / sceneDomElementHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(sceneDomElementWidth, sceneDomElementHeight);
        }

        window.addEventListener('resize', onWindowResize, false);
    }
};



