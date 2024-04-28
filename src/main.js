const { invoke } = window.__TAURI__.tauri

var map = L.map('map').setView([50, 14.5], 5);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
    minZoom: 3,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const squareRadiusMeters = 100000;

window.datetime = '2023082800'
window.filenames = {
    "gradT": 'C:/Users/potuz/Desktop/UFA/kaca/rust-mapa/data/gradT.csv',
    "vMer": 'C:/Users/potuz/Desktop/UFA/kaca/rust-mapa/data/vMer.csv', // merizonalni rychlost
    "vZon": 'C:/Users/potuz/Desktop/UFA/kaca/rust-mapa/data/vZon.csv', // zonalni rychlost
    "front": 'C:/Users/potuz/Desktop/UFA/kaca/rust-mapa/data/fronta.csv', // fronta - studena nebo tepla
}
window.data = {}
window.markers = []

get_data(window.filenames["gradT"]).then(function(response) {
    window.data["gradT"] = response
    window.locations = response["locations"]
    showPoints(window.locations)
    showPointsGradT(window.datetime, window.data["gradT"])
})
get_data(window.filenames["front"]).then(function(response) {
    window.data["front"] = response
})
get_data(window.filenames["vMer"]).then(function(response) {
    window.data["vMer"] = response
    get_data(window.filenames["vZon"]).then(function(response) {
        window.data["vZon"] = response
        showPointsV(window.datetime, window.data['vMer'], window.data['vZon'])
    })
})

const zeroPad = (num, places) => String(num).padStart(places, '0')

function calcAngleDegrees(x, y) {
    return (Math.atan2(y, x) * 180) / Math.PI;
}

function showPoints(locations) {
    locations.forEach(location => {
        lat = location[1]
        lng = location[0]
        let icon = L.divIcon({className: 'location-icon', html: "<i class='fa fa-circle'></i>"});
        let marker = L.marker([lat, lng], {icon: icon})
        marker.addTo(map)
        // nevolam window.markers.push(marker), protoze tyhle markery by mely zustat permanentne
    })
}

function showPointsGradT(datetime, data) {
    let maxGradT = Math.max(...data.data[datetime])
    let minGradT = Math.min(...data.data[datetime])
    let step = (maxGradT - minGradT) / 7

    for (let i = 0; i < data.data[datetime].length; i++) {
        var value = data.data[datetime][i]; 
        let color = '#aa335c';
        if (value < maxGradT-step) {
            color = '#d75963';
        }
        if (value < maxGradT-step) {
            color = '#e19745';
        }
        if (value < maxGradT-step*2) {
            color = '#e3cc3b';
        }
        if (value < maxGradT-step*3) {
            color = '#b8db41';
        }
        if (value < maxGradT-step*4) {
            color = '#52c84a';
        }
        if (value < maxGradT-step*5) {
            color = '#4aa7a2';
        }
        if (value < maxGradT-step*6) {
            color = '#4b67bc';
        }
        let icon = L.divIcon({className: 'number-icon icon-under', html: "<b>" + parseFloat(value).toFixed(2) + "</b>"});
        lat = data.locations[i][1]
        lng = data.locations[i][0]
        let bounds = L.latLng(lat, lng).toBounds(squareRadiusMeters); 
        let rect = L.rectangle(bounds, {color: color, weight: 0, fillOpacity: .7});
        rect.addTo(map)
        window.markers.push(rect)
        let marker = L.marker([lat, lng], {icon: icon})
        marker.addTo(map)
        window.markers.push(marker)
    }
}

// ukazuje -1 pro teplou a 1 pro studenou frontu - obsolete
function showPointsFront(datetime, data) {
    for (let i = 0; i < data.data[datetime].length; i++) {
        var value = data.data[datetime][i];
        if (value == -777) {continue}
        let color = '#ff0000';
        if (value == 1) {
            color = '#0000ff';
        }
        let icon = L.divIcon({className: 'number-icon icon-above', html: `<b style='color: ${color}'>${value}</b>`});
        lat = data.locations[i][1]
        lng = data.locations[i][0]
        let marker = L.marker([lat, lng], {icon: icon})
        marker.addTo(map)
        window.markers.push(marker)
    }
}

function showPointsV(datetime, dataMer, dataZon) {
    for (let i = 0; i < dataMer.data[datetime].length; i++) {
        var vMer = dataMer.data[datetime][i];
        var vZon = dataZon.data[datetime][i];
        if (vMer == -777) {continue}
        if (vZon == -777) {continue}

        let angleDeg = calcAngleDegrees(vZon, vMer)
        let length = Math.sqrt(vZon**2 + vMer**2)
        
        let color = 'black'
        if (window.data["front"]) {
            if (window.data["front"].data[datetime][i] == 1) {color = 'red'}
            if (window.data["front"].data[datetime][i] == -1) {color = 'blue'}
        }

        let icon = L.divIcon({className: `arrow-icon icon-above arrow-${color}`, html: `<i style="--rotate: ${angleDeg}deg; --length: ${length}"></i>`});
        lat = dataMer.locations[i][1]
        lng = dataMer.locations[i][0]
        let marker = L.marker([lat, lng], {icon: icon})
        marker.addTo(map)
        window.markers.push(marker)
    }
}

map.on('zoomend', function() {   
    var currentZoom = map.getZoom();
    document.body.style.setProperty('--current-zoom', currentZoom);
});

async function get_data(filename) {
    response = await invoke('get_data', {filename:filename})
        .then((response) => {
            return response;
        })
    return JSON.parse(response)
}

document.getElementById('reload-button').addEventListener('click', e => {
    window.markers.forEach(marker => {
        map.removeLayer(marker)
    })
    let date_iso = document.getElementById('date-input').value;
    let date = new Date(date_iso);

    let year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    let formattedDate = `${year}${month}${day}`;

    let hour = zeroPad(document.getElementById('time-select').value, 2)
    let datetime = formattedDate + hour
    
    if (datetime.length != 10) {
        // DODELAT ERROR MESSAGE
        return
    }

    window.datetime = datetime
    showPointsGradT(datetime, window.data["gradT"]);
    showPointsV(datetime, window.data["vMer"], window.data["vZon"])

    let datetimeDisplayEle = document.getElementById('datetime-display')
    prettyDatetime = `${day}.${month}.${year} ${hour}h`
    datetimeDisplayEle.innerText = prettyDatetime
})