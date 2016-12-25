"use strict";
const socket = io();
let roomCoordinates = {};
let roomInfo = [];
let winHeight = 0;
let statusBar = {};

window.onload = function() {
    winHeight = window.innerHeight;
    const minRadius = 5;
    const maxRadius = 50;

    statusBar = document.getElementsByClassName('status')[0];
    let wrapper = document.getElementById('heatmapContainerWrapper');

    updateStatus("Initial page loaded");

    const heatmap = h337.create({
        maxOpacity: .75,
        container: document.getElementById('heatmapContainer')
    });
    let canvas = document.getElementsByTagName('canvas')[0];
    canvas.width = winHeight;
    canvas.height = winHeight;
    window.h = heatmap;

    updateStatus("Document set up. Waiting for data...");

    socket.on('locations', data => {
        updateStatus("Data received. Analyzing...");
        roomCoordinates = data[0];
        roomInfo = sortProperties(data[1]);
        const maxStudents = roomInfo[0][1];

        let points = [];
        roomInfo.forEach(room => {
            if (!roomCoordinates.hasOwnProperty(room[0]))
                console.log(`${room[0]} does not have any coordinates`);

            points.push({
                x: Math.floor(roomCoordinates[room[0]][0] * (winHeight + 5)),
                y: Math.floor(roomCoordinates[room[0]][1] * winHeight),
                value: room[1],
                radius: minRadius + (maxRadius - minRadius) * (room[1] / maxStudents)
            });

            let pTag = document.createElement("P");
            let innerText = document.createTextNode(room[0] + ' - ' + room[1]);
            pTag.appendChild(innerText);

            document.getElementById("classes").appendChild(pTag);
        });
        heatmap.setData({
            max: maxStudents,
            data: points
        });
        updateStatus("Document ready!");
        canvas.addEventListener("click", findClosestRoom, false);
    });
    socket.on('serverupdate', message => {
        updateStatus(message);
    });
};

function findClosestRoom(event) {
    const distances = distFormula(event.clientX / winHeight, event.clientY / winHeight);

    if (distances.length == 0) {
        document.getElementById('label').innerHTML = "Unknown";
    } else {
        let selectLocation = distances[0][0];
        let minimum = distances[0][1];
        distances.forEach(distance => {
            if (distance[1] < minimum) {
                minimum = distance[1];
                selectLocation = distance[0];
            }
        });
        document.getElementById('label').innerHTML = selectLocation + ' - ' + roomInfo.find((elm) => {
          if (elm[0] == selectLocation) {
            return elm;
          }
        })[1];
    }
}

function distFormula(x, y) {
    let distances = [];
    const clickReach = 0.03;

    for (let room in roomCoordinates) {
        let distance = Math.hypot(roomCoordinates[room][0] - x, roomCoordinates[room][1] - y);
        if (distance < clickReach)
            distances.push([room, distance]);
    }
    return distances;
}

function updateStatus(message) {
    statusBar.innerHTML = message;
}

// Source: https://gist.github.com/umidjons/9614157

function sortProperties(obj) {
    // convert object into array
    let sortable = [];
    for (let key in obj)
        if (obj.hasOwnProperty(key))
            sortable.push([key, obj[key]]); // each item is an array in format [key, value]

        // sort items by value
    sortable.sort((a, b) => {
        return b[1] - a[1]; // compare numbers
    });
    return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
}
