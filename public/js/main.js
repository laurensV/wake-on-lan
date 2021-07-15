let devices, newDevices;
const handleError = (error) => {
    console.error(error);
    alert(error)
}

const newDeviceDOMItem = (device) => {
    var listItem = document.createElement("li"); // Create li element
    listItem.id = device["mac"];
    listItem.innerHTML = `
    <div class='name'>Name: <span class="name-value">${device.name}</span></div>
    <div class='ip'>IP: ${device.ip}</div>
    <div class='mac'>MAC: ${device.mac}</div>
    <div class='vendor'>Vendor: ${device.vendor}</div>`;
    newDevices.appendChild(listItem); // Add li to the ul

    // Add Device Button
    var wakeButton = document.createElement('button');
    wakeButton.classList.add('button','is-primary');
    var buttonText = document.createTextNode('Add');
    wakeButton.appendChild(buttonText);
    listItem.appendChild(wakeButton); // Add div to li to appear on hover
    wakeButton.onclick = async () => {
        if(await addDevice(device, wakeButton)) {
            listItem.remove()
        }

    }; // add this device
    return listItem
}

const deviceDOMItem = (device) => {
    var listItem = document.createElement("li"); // Create li element
    listItem.id = device["mac"];
    listItem.innerHTML = `
    <div class='name'>Name: <span class="name-value">${device.name}</span></div>
    <div class='ip'>IP: ${device.ip}</div>
    <div class='mac'>MAC: ${device.mac}</div>
    <div class='vendor'>Vendor: ${device.vendor || 'unknown'}</div>
    <div class='last-online'>Last online: <span class="last-online-value">${device.lastOnline ? moment(device.lastOnline).fromNow() : "never"}</span></div>`;
    devices.appendChild(listItem); // Add li to the ul

    // Wake Device Button
    var wakeButton = document.createElement('button');
    wakeButton.classList.add('button','is-info');
    var buttonText = document.createTextNode('Wake');
    wakeButton.appendChild(buttonText);
    listItem.appendChild(wakeButton); // Add div to li to appear on hover
    wakeButton.onclick = () => {wakeDevice(device["mac"], wakeButton)}; // Wake this mac_addr
    // Remove Device Button
    var removeButton = document.createElement('button');
    removeButton.classList.add('button','is-danger');
    var buttonText = document.createTextNode('Remove');
    removeButton.appendChild(buttonText);
    listItem.appendChild(removeButton); // Add div to li to appear on hover
    removeButton.onclick = () => {removeDevice(device["mac"], removeButton)}; // Wake this mac_addr
    return {listItem, wakeButton, removeButton};
}

const getDevices = async () => {
    const refresh = document.getElementById('refresh');
    devices.innerHTML = "Loading..";
    refresh.disabled = true;
    let deviceData;
    try {
        const response = await fetch('/devices');
        if (response.status !== 200)
            throw new Error('Could not fetch devices');
        deviceData = await response.json();
        devices.innerHTML = "";
        const pings = [];
        for (const p in deviceData) {
            const {wakeButton, listItem} = deviceDOMItem(deviceData[p])
            pings.push(pingDevice(deviceData[p]["ip"],listItem, wakeButton));
        }
        await Promise.all(pings);
    } catch (e) {
        handleError(e)
        devices.innerHTML = "Could not fetch devices"
    } finally {
        refresh.disabled = false;
    }
}

const findDevices = async () => {
    const scan = document.getElementById('scan');
    newDevices.innerHTML = "Loading..";
    scan.disabled = true;
    let deviceData;
    try {
        const response = await fetch('/devices/find');
        if (response.status !== 200)
            throw new Error('Could not fetch new devices');
        deviceData = await response.json();
        newDevices.innerHTML = "";
        const pings = [];
        for (const p in deviceData) {
            const deviceItem = newDeviceDOMItem(deviceData[p])
            getDeviceName(deviceData[p].ip,deviceData[p].name, deviceItem)
        }
    } catch (e) {
        handleError(e)
        newDevices.innerHTML = "Could not fetch new devices"
    } finally {
        scan.disabled = false;
    }
}

const getDeviceName = async (ip, name, device) => {
    try {
        const nameEl = device.getElementsByClassName('name-value')[0];

        if (name === '' || name === '?') {
            nameEl.innerHTML = 'Loading..';
        }
        const rawResponse = await fetch('/devices/name', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ip})
        });
        const response = await rawResponse.json();
        if (rawResponse.status !== 200) {
            if (response.type === 'ValidationError') {
                throw new Error(response.error);
            }
            throw new Error("Could not get name of device");
        }


        if (response.name) {
            nameEl.innerHTML = response.name;
        } else {
            nameEl.innerHTML = name;
        }
    } catch (e) {
        handleError(e)
    } finally {
        button.classList.remove('is-loading')
    }
}

const pingDevice = async (ip, device, button) => {
    try {
        button.classList.add('is-loading')
        device.classList.remove('has-text-success','has-text-danger')
        const rawResponse = await fetch('/devices/ping', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ip})
        });
        const response = await rawResponse.json();
        if (rawResponse.status !== 200) {
            if (response.type === 'ValidationError') {
                throw new Error(response.error);
            }
            throw new Error("Could not ping device");
        }


        if (response.alive) {
            device.classList.add('has-text-success');
            device.getElementsByClassName('last-online-value')[0].innerHTML = moment(new Date()).fromNow();
            button.disabled = true;
        } else {
            device.classList.add('has-text-danger');
        }
    } catch (e) {
        handleError(e)
    } finally {
        button.classList.remove('is-loading')
    }
}

const addDevice = async (device) => {
    let success = false;
    const add = document.getElementById('add');
    try {
        add.disabled = true;
        const rawResponse = await fetch('/devices/add', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(device)
        });
        if (rawResponse.status !== 200) {
            const response = await rawResponse.json();
            if (response.type === 'ValidationError') {
                throw new Error(response.error);
            }
            throw new Error("Could not add device");
        }

        const {wakeButton, listItem} = deviceDOMItem(device);
        pingDevice(device.ip, listItem, wakeButton);
        success = true;
    } catch (e) {
        handleError(e)
    } finally {
        add.disabled = false;
    }
    return success;
}

const removeDevice = async (mac, button) => {
    const device = document.getElementById(mac);
    try {
        button.classList.add('is-loading')
        const rawResponse = await fetch('/devices/remove', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({mac})
        });
        if (rawResponse.status !== 200) {
            const response = await rawResponse.json();
            if (response.type === 'ValidationError') {
                throw new Error(response.error);
            }
            throw new Error("Could not remove device");
        }

        device.remove();
    } catch (e) {
        handleError(e)
        button.classList.remove('is-loading')
    }
}

const wakeDevice = async (mac, button) => {
    try {
        button.classList.add('is-loading')
        const rawResponse = await fetch('/devices/wol', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({mac})
        });
        const response = await rawResponse.json();
        if (rawResponse.status !== 200) {
            if (response.type === 'ValidationError') {
                throw new Error(response.error);
            }
            throw new Error("Could not wake device");
        }

        alert(response);
    } catch (e) {
        handleError(e);
    } finally {
        button.classList.remove('is-loading')
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    devices = document.getElementById('devices');
    newDevices = document.getElementById('newDevices');
    getDevices();
});
