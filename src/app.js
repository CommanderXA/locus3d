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
const material = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });

function latLngAltToMeters(lat, lng, alt) {
    return [lat * 111.32, lng * 40075 * Math.cos(lat) / 360, alt * 0.3048];
}

async function initMap() {
    const mapDiv = document.getElementById("map");
    const apiLoader = new Loader(apiOptions);
    await apiLoader.load();
    return new google.maps.Map(mapDiv, mapOptions);
}

function initWebGLOverlayView(map) {
    let scene, renderer, camera, loader;
    const webGLOverlayView = new google.maps.WebGLOverlayView();

    webGLOverlayView.onAdd = () => {
        // set up the scene
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera();
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75); // soft white light
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
        directionalLight.position.set(0.5, -1, 0.5);
        scene.add(directionalLight);

        // load the model    
        loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        loader.setDRACOLoader(dracoLoader);

        let geometry = new THREE.BufferGeometry().setFromPoints(points);
        let line = new THREE.Line(geometry, material);
        scene.add(line);

        const source = "./models/ruby.gltf";
        loader.load(
            source,
            function (gltf) {
                gltf.scene.scale.set(1, 2, 1);
                gltf.scene.rotation.x = 90 * Math.PI / 180; // rotations are in radians
                scene.add(gltf.scene);
                gltf.animations;
                gltf.scene;
                gltf.asset;
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

        // solid area
        let mesh = new THREE.Mesh(
            new THREE.SphereGeometry(1, 20, 20),
            new THREE.MeshBasicMaterial({ color: 0x0000FF, wireframe: false, transparent: true, opacity: 0.1 })
        );
        mesh.rotation.x = Math.PI / 2;
        scene.add(mesh);

        // wireframe area
        let mesh2 = new THREE.Mesh(
            new THREE.SphereGeometry(1, 20, 20),
            new THREE.MeshBasicMaterial({ color: 0x0000FF, wireframe: true, transparent: true, opacity: 0.1 })
        );
        mesh2.applyMatrix4(new THREE.Matrix4().makeScale(areaOptions.horizontalAccuracy, areaOptions.verticalAccuracy, areaOptions.horizontalAccuracy));
        mesh2.rotation.x = Math.PI / 2;
        scene.add(mesh2);

        // showing the data
        for (let i = 0; i < data.length; i++) {
            const dataListItem = document.createElement("option");
            const dataListItemPicture = document.createElement("div");
            const dataListItemContent = document.createElement("div");
            const dataListItemTitle = document.createElement("div");
            const dataListItemText = document.createElement("div");

            dataListItem.className = "data-list-item";
            dataListItem.value = i;

            dataListItemPicture.className = "data-list-item-picture";
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
                map.setCenter(mapOptions.center, 50);

                areaOptions.horizontalAccuracy = data[selectedValue][0]['Horizontal accuracy'];
                areaOptions.verticalAccuracy = data[selectedValue][0]['Vertical accuracy'];

                // rescaling the area
                mesh.scale.x = mesh2.scale.x = 0;
                mesh.scale.y = mesh2.scale.y = 0;
                mesh.scale.z = mesh2.scale.z = 0;

                mesh.scale.x = mesh2.scale.x = areaOptions.horizontalAccuracy;
                mesh.scale.y = mesh2.scale.y = areaOptions.verticalAccuracy;
                mesh.scale.z = mesh2.scale.z = areaOptions.horizontalAccuracy;

                // check wheteher there is a trajectory and add points if is
                if (data[selectedValue][1] !== undefined || data[selectedValue][1] !== null) {
                    for (let [key, value] of Object.entries(data[selectedValue])) {

                        let [latOrigin, lngOrigin, altOrigin] = latLngAltToMeters(
                            mapOptions.center.lat,
                            mapOptions.center.lng,
                            mapOptions.altitude,
                        );
                        let [lat, lng, alt] = latLngAltToMeters(
                            value.Latitude,
                            value.Longitude,
                            value.Altitude
                        );
                        points.push(
                            new THREE.Vector3(
                                latOrigin - lat, lngOrigin - lng, altOrigin - alt
                            )
                        );
                    }
                }

                // drawing trajectory
                geometry = new THREE.BufferGeometry().setFromPoints(points);
                line = new THREE.Line(geometry, material);

                console.log(points);

                webGLOverlayView.requestRedraw();
            });

            dataListItemContent.appendChild(dataListItemTitle);
            dataListItemContent.appendChild(dataListItemText);
            dataListItem.appendChild(dataListItemPicture);
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
