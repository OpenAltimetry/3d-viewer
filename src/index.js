/*
Author: Kai Lin - klin (at) sdsc.edu
07/16/2020
Copyright (c) 2007 The Regents of the University of California

Permission to use, copy, modify, and distribute this software and its documentation
for educational, research and non-profit purposes, without fee, and without a written
agreement is hereby granted, provided that the above copyright notice, this
paragraph and the following three paragraphs appear in all copies.

Permission to make commercial use of this software may be obtained
by contacting:
Technology Transfer Office
9500 Gilman Drive, Mail Code 0910
University of California
La Jolla, CA 92093-0910
(858) 534-5815
invent@ucsd.edu

THIS SOFTWARE IS PROVIDED BY THE REGENTS OF THE UNIVERSITY OF CALIFORNIA AND
CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT
NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import OpenAltimetryElevationProfile from './OpenAltimetryElevationProfile';
import * as serviceWorker from './serviceWorker';
import OpenAltimetryPhoton from "./OpenAltimetryPhoton";

document.getElementById("panel").innerHTML =
    "<div style = 'display:flex; position:absolute; top:0; bottom:0; right:0; left:0; '>\n" +
    "      <div id='div_you_want_centered' style = 'margin:auto;'> \n" +
    "           <div style='text-align: center'><img src='https://i.gifer.com/ZKZg.gif' width=100 height=100/><br>" +
    "           <div id='load_message'>Loading data ......<br></div></div>" +
    "      </div>\n" +
    " </div>";

let high = [];
let medium = [];
let low = [];
let minx = 180;
let maxx = -180;
let miny = 90;
let maxy = -90;
let minz = 10000;
let maxz = -10000;
let trackid = window.trackId ? window.trackId : '';
let date = window.date ? window.date : '';

if (window.elevation) {
    fetch(window.elevation)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                ReactDOM.render(
                    <div style={{fontWeight: 'bold', fontSize: 16, color: 'brown', padding: '20pt 20pt 20pt 20pt'}}>
                        Error: {data.message}
                    </div>,
                    document.getElementById('panel')
                );
            } else {
                ReactDOM.render(
                    <React.StrictMode>
                        <OpenAltimetryElevationProfile data={data}/>
                    </React.StrictMode>,
                    document.getElementById('panel')
                );
            }
        });
} else {
    //var data_url = 'http://localhost:3000/photon_2018-11-13_t706_1594076129968.json';
    var data_url = window.photon;
    process_data(data_url);
}


function process_data(data_url) {
    fetch(data_url)
        .then(response => response.json())
        .then(data => {
            for (var i = 0; i < data.length; i++) {
                console.log("===================================");
                console.log("beam name: " + data[i].beam_name);
                console.log("total_photon_count: " + data[i].total_photon_count);

                for (var j = 0; j < data[i].series.length; j++) {
                    console.log("     " + data[i].series[j].name + "    " + data[i].series[j].photon_count);

                    let confidence = 2;
                    if (data[i].series[j].name === 'Low') {
                        confidence = 2;
                    } else if (data[i].series[j].name === 'Medium') {
                        confidence = 3;
                    } else if (data[i].series[j].name === 'High') {
                        confidence = 4;
                    }

                    for (var k = 0; k < data[i].series[j].data.length; k++) {
                        let record = data[i].series[j].data[k];
                        let item = {
                            lat: record[0],
                            lng: record[1],
                            height: record[2],
                            q: confidence,
                            beam: data[i].beam_name
                        };

                        if (confidence === 2) {
                            low.push(item);
                        }
                        if (confidence === 3) {
                            medium.push(item);
                        }
                        if (confidence === 4) {
                            high.push(item);
                        }

                        minx = Math.min(minx, item.lng);
                        maxx = Math.max(maxx, item.lng);
                        miny = Math.min(miny, item.lat);
                        maxy = Math.max(maxy, item.lat);
                        minz = Math.min(minz, item.height);
                        maxz = Math.max(maxz, item.height);
                    }

                }
            }

            console.log("high number: " + high.length);
            console.log("medium number: " + medium.length);
            console.log("low number: " + low.length);
            console.log("min lat=" + miny);
            console.log("max lat=" + maxy);
            console.log("min lng=" + minx);
            console.log("max lng=" + maxx);
            console.log("min height=" + minz);
            console.log("max height=" + maxz);

            ReactDOM.render(
                <React.StrictMode>
                    <OpenAltimetryPhoton high={high}
                                         medium={medium}
                                         low={low}
                                         metadata={{minx, maxx, miny, maxy, minz, maxz, trackid, date}}/>
                </React.StrictMode>,
                document.getElementById('panel')
            );
        });


}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
