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
}

let points = [];
const material = new THREE.LineBasicMaterial({ color: 0x0000ff });

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

        var data = require('./data/data.json');
        const dataList = document.getElementById("data-list");

        mapOptions.center = {
            lat: data[0][0].Latitude,
            lng: data[0][0].Longitude,
        };
        mapOptions.altitude = data[0][0].Altitude;

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

            dataList.addEventListener('change', function(event) {
                let selectedValue = event.target.value;
                points = [];

                // Update the center position
                mapOptions.center = {
                    lat: data[selectedValue][0].Latitude,
                    lng: data[selectedValue][0].Longitude,
                }
                mapOptions.altitude = data[selectedValue][0].Altitude;
                map.setCenter(mapOptions.center);

                if (data[selectedValue][1] !== undefined || data[selectedValue][1] !== null) {
                    for (let [key, value] of Object.entries(data[selectedValue])) {
                        points.push(new THREE.Vector3(value.Latitude, value.Longitude, value.Altitude));
                    }
                }
                console.log(points);
                let geometry = new THREE.BufferGeometry().setFromPoints(points);
                let line = new THREE.Line(geometry, material);

                scene.add(line);
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

        console.log(points);

        const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);
        camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

     
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
