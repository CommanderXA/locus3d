import { Loader } from '@googlemaps/js-api-loader';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const apiOptions = {
    apiKey: process.env.MAPS_API,
    version: "beta"
};

let mapOptions = {
    "tilt": 65,
    "heading": 20,
    "zoom": 40,
    "center": { lat: 51.5072, lng: 0.1276 },
    "altitude": 20,
    "mapId": process.env.MAP_ID,
};

let areaOptions = {
    "horizontalAccuracy": 1,
    "verticalAccuracy": 1,
};

let points = [];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function initMap() {
    const mapDiv = document.getElementById("map");
    const apiLoader = new Loader(apiOptions);
    await apiLoader.load();
    return new google.maps.Map(mapDiv, mapOptions);
}

function initWebGLOverlayView(map) {
    let scene, renderer, camera, loader;
    const webGLOverlayView = new google.maps.WebGLOverlayView();

    google.maps.event.addDomListener(document.getElementById("reset"), 'click', function () {
        map.setCenter(mapOptions.center);
        map.setZoom(mapOptions.zoom);
        map.setTilt(mapOptions.tilt);
    });

    let playbackButton = document.getElementById("playback");
    google.maps.event.addDomListener(playbackButton, 'click', async function () {
        let playbackComplete = document.getElementById("playback-complete");
        playbackComplete.innerHTML = '<h2 id="playback-title">Playback:</h2>' + '<h2 class="h2-value">0%</h2>';
        for (let i = 0; i < points.length; i++) {
            mapOptions.center = {
                lat: points[i].lat,
                lng: points[i].lng
            };
            map.panTo(mapOptions.center);
            map.setZoom(20);
            mapOptions.altitude = points[i].Altitude;
            playbackComplete.innerHTML = '<h2 id="playback-title">Playback:</h2>' + '<h2 class="h2-value">'
                + Math.round(((points[i].timestamp - points[0].timestamp)
                    / (points[points.length - 1].timestamp - points[0].timestamp)
                ) * 100) + "%" + '</h2>';
            if (i < points.length) {
                // await sleep(points[i + 1].timestamp - points[i].timestamp);
                await sleep(1000);
            }
            playbackComplete.innerHTML = '';
        }
        webGLOverlayView.requestRedraw();
    });

    webGLOverlayView.onAdd = () => {
        // set up the scene
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera();
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75); // soft white light
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
        directionalLight.position.set(0.5, -1, 0.5);
        scene.add(directionalLight);

        // load model
        loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        loader.setDRACOLoader(dracoLoader);

        const source = "./models/duck.gltf";
        loader.load(
            source,
            function (gltf) {
                gltf.scene.scale.set(1, 1, 1);
                gltf.scene.rotation.x = 90 * Math.PI / 180; // rotations are in radians
                scene.add(gltf.scene);

                dataList.addEventListener('change', function (event) {
                    scene.remove(gltf.scene);
                });
            }, undefined, function (error) {
                console.error(error);
            }
        );

        // location data
        var data = require('./data/data.json');
        const dataList = document.getElementById("data-list");

        // initial setup of the center and area
        mapOptions.center = {
            lat: data[0][0].Latitude,
            lng: data[0][0].Longitude,
        };
        mapOptions.altitude = data[0][0].Altitude;
        areaOptions.horizontalAccuracy = data[0][0]['Horizontal accuracy'];
        areaOptions.verticalAccuracy = data[0][0]['Vertical accuracy'];

        // initialize info
        let activityValue = document.getElementById("activity-value");
        activityValue.innerHTML = data[0][0].Activity;

        let identifier = document.getElementById("identifier");
        if (data[0][0].Identifier !== undefined && data[0][0].Identifier !== 'null') {
            identifier.innerHTML = '<h2 id="identifier">Identifier:</h2>"' + '<h2 class="h2-value">' + data[0][0].Identifier + '</h2>';
        }

        let floor = document.getElementById("floor");
        if (data[0][0]['Floor label'] !== undefined && data[0][0]['Floor label'] !== 'null') {
            floor.innerHTML = '<h2 id="floor">Floor:</h2>' + '<h2 class="h2-value">' + data[0][0]['Floor label'] + '</h2>';
        }

        if (data[0][1] !== undefined && data[0][1] !== null) {
            playbackButton.style.display = "block";
        } else {
            playbackButton.style.display = "none";
        }

        // solid area
        let mesh = new THREE.Mesh(
            new THREE.SphereGeometry(1, 20, 20),
            new THREE.MeshBasicMaterial({ color: 0x43A6C6, wireframe: false, transparent: true, opacity: 0.2 })
        );
        mesh.applyMatrix4(new THREE.Matrix4().makeScale(areaOptions.horizontalAccuracy, areaOptions.verticalAccuracy, areaOptions.horizontalAccuracy));
        mesh.rotation.x = Math.PI / 2;
        scene.add(mesh);

        // wireframe area
        let mesh2 = new THREE.Mesh(
            new THREE.SphereGeometry(1, 20, 20),
            new THREE.MeshBasicMaterial({ color: 0x43A6C6, wireframe: true, transparent: true, opacity: 0.2 })
        );
        mesh2.applyMatrix4(new THREE.Matrix4().makeScale(areaOptions.horizontalAccuracy, areaOptions.verticalAccuracy, areaOptions.horizontalAccuracy));
        mesh2.rotation.x = Math.PI / 2;
        scene.add(mesh2);

        let solid = document.getElementById("solid");
        solid.addEventListener('click', function () {
            switch (mesh.material.opacity) {
                case 0:
                    mesh.material.opacity = 0.2;
                    solid.style.backgroundColor = "#419210";
                    solid.style.color = "#fff";
                    break;
                case 0.2:
                    mesh.material.opacity = 0;
                    solid.style.backgroundColor = "#ccc";
                    solid.style.color = "#333";
                    break;
            }
        });

        let wireframe = document.getElementById("wireframe");
        wireframe.addEventListener('click', function () {
            switch (mesh2.material.opacity) {
                case 0:
                    mesh2.material.opacity = 0.2;
                    wireframe.style.backgroundColor = "#419210";
                    wireframe.style.color = "#fff";
                    break;
                case 0.2:
                    mesh2.material.opacity = 0;
                    wireframe.style.backgroundColor = "#ccc";
                    wireframe.style.color = "#333";
                    break;
            }
        });

        // showing the data
        for (let i = 0; i < data.length; i++) {
            const dataListItem = document.createElement("option");
            const dataListItemContent = document.createElement("div");
            const dataListItemTitle = document.createElement("div");
            const dataListItemText = document.createElement("div");

            dataListItem.className = "data-list-item";
            dataListItem.value = i;

            dataListItemContent.className = "data-list-item-content";
            dataListItemTitle.className = "data-list-item-title";
            dataListItemText.className = "data-list-item-text";

            dataListItemTitle.innerHTML = "<b>Dev" + (i + 1) + "</b> " + data[i][0].Identifier;
            dataListItemText.innerHTML = "; " + data[i][0].Activity;

            dataList.addEventListener('change', function (event) {
                let selectedValue = event.target.value;
                points = [];

                // update the center position
                mapOptions.center = {
                    lat: data[selectedValue][0].Latitude,
                    lng: data[selectedValue][0].Longitude,
                }
                mapOptions.altitude = data[selectedValue][0].Altitude;
                map.setCenter(mapOptions.center);
                map.setZoom(mapOptions.zoom);

                areaOptions.horizontalAccuracy = data[selectedValue][0]['Horizontal accuracy'];
                areaOptions.verticalAccuracy = data[selectedValue][0]['Vertical accuracy'];

                // update properties
                activityValue.innerHTML = data[selectedValue][0].Activity;

                if (data[selectedValue][0].Identifier !== undefined && data[selectedValue][0].Identifier !== 'null') {
                    identifier.innerHTML = '<h2 id="identifier">Identifier:</h2>' + '<h2 class="h2-value">' + data[selectedValue][0].Identifier + '</h2>';
                } else {
                    identifier.innerHTML = "";
                }

                if (data[selectedValue][0]['Floor label'] !== undefined && data[selectedValue][0]['Floor label'] !== 'null') {
                    floor.innerHTML = '<h2 id="floor">Floor:</h2>' + '<h2 class="h2-value">' + data[selectedValue][0]['Floor label'] + '</h2>';
                } else {
                    floor.innerHTML = "";
                }

                if (data[selectedValue][1] !== undefined && data[selectedValue][1] !== null) {
                    playbackButton.style.display = "block";
                } else {
                    playbackButton.style.display = "none";
                }

                let source = "";
                switch (data[selectedValue][0].Activity.toLowerCase()) {
                    case "cycling":
                        source = "./models/bike.gltf"
                        break;
                    case "driving":
                        source = "./models/car.gltf"
                        break;
                    case "unknown":
                    case "walking":
                    case "running":
                        source = "./models/duck.gltf"
                }

                loader.load(
                    source,
                    function (gltf) {
                        gltf.scene.scale.set(1, 1, 1);
                        gltf.scene.rotation.x = 90 * Math.PI / 180; // rotations are in radians
                        scene.add(gltf.scene);

                        dataList.addEventListener('change', function (event) {
                            scene.remove(gltf.scene);
                        });

                    }, undefined, function (error) {
                        console.error(error);
                    }
                );

                // rescaling the area
                mesh.scale.x = mesh2.scale.x = 0;
                mesh.scale.y = mesh2.scale.y = 0;
                mesh.scale.z = mesh2.scale.z = 0;

                mesh.scale.x = mesh2.scale.x = areaOptions.horizontalAccuracy;
                mesh.scale.y = mesh2.scale.y = areaOptions.verticalAccuracy;
                mesh.scale.z = mesh2.scale.z = areaOptions.horizontalAccuracy;

                // check wheteher there is a trajectory and add points if is
                if (data[selectedValue][1] !== undefined || data[selectedValue][1] !== null) {
                    for (let [_key, value] of Object.entries(data[selectedValue])) {
                        points.push(
                            { lat: value.Latitude, lng: value.Longitude, altitude: value.Altitude, timestamp: value.Timestamp }
                        );
                    }
                }

                webGLOverlayView.requestRedraw();
            });

            dataListItemContent.appendChild(dataListItemTitle);
            dataListItemContent.appendChild(dataListItemText);
            dataListItem.appendChild(dataListItemContent);
            dataList.appendChild(dataListItem);
        }
    }

    webGLOverlayView.onContextRestored = ({ gl }) => {
        // create the three.js renderer, using the
        // maps's WebGL rendering context.
        renderer = new THREE.WebGLRenderer({
            canvas: gl.canvas,
            context: gl,
            ...gl.getContextAttributes(),
        });
        renderer.autoClear = false;

        map.setCenter(mapOptions.center);

        // wait to move the camera until the 3D model loads    
        loader.manager.onLoad = () => { }
    }

    webGLOverlayView.onDraw = ({ gl, transformer }) => {
        // update camera matrix to ensure the model is georeferenced correctly on the map
        let latLngAltitudeLiteral = {
            lat: mapOptions.center.lat,
            lng: mapOptions.center.lng,
            altitude: mapOptions.altitude,
        }

        const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);
        camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

        // Request a redraw and render the scene.
        webGLOverlayView.requestRedraw();
        renderer.render(scene, camera);

        // always reset the GL state
        renderer.resetState();
    }
    webGLOverlayView.setMap(map);
}

(async () => {
    const map = await initMap();
    initWebGLOverlayView(map);
})();
