# LOCUS 3D

## What is it and Intro

This is the project-solution for the Google challange at the **HackNU** Hackathon. It's called `LOCUS 3D`.

Our team consisted of **2 students** from **Astana IT University**.

## The task

The challange required to work with Google Maps, more precisely with Google Maps JS API, THREE.js and WebGL.

We had been given a mock data, which we parsed into `JSON` using `Python` and `Pandas`. This data represents information about location of a particular person along with the activity type (e.g. Driving, Walking, etc.) and other meta-data. The problem was to take these data point with meta-data and visualize it on `Google Map` in 3D.

The main object that describes position of a person is marker, we have loaded several 3D models to show the activity type.

The blue area that surrounds the model is the area of uncertainty (e.g. the person migth be at any point from that field).

**UI Functions:**
- Meta-data will be displayed in the menu if it exists.
- The `reset position` button returns to the position where the marker is located. 
- Two buttons called `Solid` and `Wareframe` are responsible for enabling/disabling of area of uncertainty\
- The green box is a select, from which the mock data might be chosen
- For those data elements that consist of sequence of points it is available to playback this sequence (1s per step).

## Setup

### Requirements

- NodeJS
- Google Maps API

### `.env` file

This file has to contain (All of that is available on Google Maps Developer Console)

- MAPS_API
- MAP_ID

### To run the project execute:

- `npm i`
- `npm start`

## License

The project is under MIT License

## Problems

If something doesn't work as intended, please disable browser add-ons that may blocking the mandatory functionality
