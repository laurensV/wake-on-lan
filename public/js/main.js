const handleError = (error) => {
    console.error(error);
    alert(error)
}

const deviceDOMItem = (device) => {
    var listItem = document.createElement("li"); // Create li element
    listItem.id = device["mac"];
    var listItemText = document.createTextNode(`${device.name} (${device.ip})`); // Create text for the li
    listItem.appendChild(listItemText); // Add text to the li
    listItem.innerHTML = `
    <div class='name'>${device.name}</div>
    <div class='ip'>${device.ip}</div>
    <div class='mac'>${device.mac}</div>`;
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
    const devices = document.getElementById('devices');
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
            const {wakeButton} = deviceDOMItem(deviceData[p])
            pings.push(pingDevice(deviceData[p]["ip"], wakeButton));
        }
        await Promise.all(pings);
    } catch (e) {
        handleError(e)
        devices.innerHTML = "Could not fetch devices"
    } finally {
        refresh.disabled = false;
    }
}

const pingDevice = async (ip, button) => {
    try {
        button.classList.add('is-loading')
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


        if (response) {
            button.disabled = true;
        }
    } catch (e) {
        handleError(e)
    } finally {
        button.classList.remove('is-loading')
    }
}

const addDevice = async (form) => {
    const add = document.getElementById('add');
    try {
        add.disabled = true;
        const device = {
            name: form.name.value,
            ip: form.ip.value,
            mac: form.mac.value
        }
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

        const {wakeButton} = deviceDOMItem(device);
        pingDevice(device.ip, wakeButton);
    } catch (e) {
        handleError(e)
    } finally {
        add.disabled = false;
    }
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
    getDevices();
});
