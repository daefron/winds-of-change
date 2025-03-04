local M = {}

local function randomValue(max)
    return max * math.random()
end

local wind = {
    direction = {
        value = randomValue(360),
        change = 0,
        gap = 0
    },
    speed = {
        value = randomValue(65),
        change = 0,
        gap = 0
    }
}

local storedSettings = {
    id = 0,
    minSpeed = 5,
    maxSpeed = 20,
    minAngle = 0,
    maxAngle = 360,
    speedChange = 5,
    angleChange = 5,
    settingsOpen = false,
    windLoop = false,
    verticalEnabled = false
}

local storedLoop = false

local function updateWind()
    local minSpeed = storedSettings.minSpeed
    local maxSpeed = storedSettings.maxSpeed
    local minAngle = storedSettings.minAngle
    local maxAngle = storedSettings.maxAngle
    local speedChange = storedSettings.speedChange
    local angleChange = storedSettings.angleChange
    local verticalEnabled = storedSettings.verticalEnabled
    if minSpeed == undefined or not maxSpeed == undefined or not minAngle == undefined or not maxAngle == undefined or
        not speedChange == undefined or not angleChange == undefined then
        return
    end
    local function changeDirection()
        local gapDiff = ((math.random() - 0.5) / 100) * (angleChange / 10)
        local newGap = gapDiff + wind.direction.gap
        local newChange = wind.direction.change + newGap
        if newChange > angleChange / 100 then
            newChange = angleChange / 100
            newGap = newGap * 0.9
        elseif newChange < angleChange / -100 then
            newChange = angleChange / -100
            newGap = newGap * 0.9
        end

        local newAngle = wind.direction.value + newChange
        if newAngle > maxAngle then
            if maxAngle == 360 and minAngle == 0 then
                newAngle = newAngle - 360
            else
                newAngle = newAngle - (angleChange / 100)
                newGap = newGap * -1
                newChange = newChange * -1
            end
        elseif newAngle < minAngle then
            if minAngle == 0 and maxAngle == 360 then
                newAngle = 360 - newAngle
            else
                newAngle = newAngle + (angleChange / 100)
                newGap = newGap * -1
                newChange = newChange * -1
            end
        end

        wind.direction.gap = newGap
        wind.direction.change = newChange
        wind.direction.value = newAngle
    end

    local function changeSpeed()
        local gapDiff = ((math.random() - 0.5) / 100) * (speedChange / 10)
        local newGap = gapDiff + wind.speed.gap
        local newChange = wind.speed.change + newGap
        if newChange > speedChange / 100 then
            newChange = speedChange / 100
            newGap = newGap * 0.9
        elseif newChange < speedChange / -100 then
            newChange = speedChange / -100
            newGap = newGap * 0.9
        end

        local newSpeed = wind.speed.value + newChange
        if newSpeed > maxSpeed then
            newSpeed = maxSpeed - (speedChange / 100)
            newGap = newGap * -1
            newChange = newChange * -1
        elseif newSpeed < minSpeed then
            newSpeed = minSpeed + (speedChange / 100)
            newGap = newGap * -1
            newChange = newChange * -1
        end

        wind.speed.gap = newGap
        wind.speed.change = newChange
        wind.speed.value = newSpeed
    end

    changeDirection()
    local radians = math.pi / 180
    local radiansDirection = wind.direction.value * radians

    changeSpeed()
    -- changes speed from m/s to km/h
    local kmhSpeed = wind.speed.value / 3.6

    local xValue = math.sin(radiansDirection) * (kmhSpeed)
    local zValue = math.cos(radiansDirection) * (kmhSpeed)
    local yValue = 0
    if (verticalEnabled) then
        yValue = zValue + xValue
    end
    be:queueAllObjectLua('obj:setWind(' .. tostring(xValue) .. "," .. tostring(zValue) .. "," .. tostring(yValue) .. ')')
end

local function onGuiUpdate()
    if (storedSettings.windLoop) then
        updateWind()
        local data = {wind.speed.value, wind.direction.value}
        guihooks.trigger('ReceiveData', data)
    end
end

local function stopWind()
    storedLoop = false
    storedSettings.windLoop = false
    be:queueAllObjectLua('obj:setWind(0,0,0)')
    guihooks.trigger('ReceiveData', {0, 0})
end

local function refreshWind(minAngle, maxAngle, minSpeed, maxSpeed)
    wind = {
        direction = {
            value = randomValue((maxAngle - minAngle)) + minAngle,
            change = 0,
            gap = 0
        },
        speed = {
            value = randomValue(maxSpeed - minSpeed) + minSpeed,
            change = 0,
            gap = 0
        }
    }
end

local function onExtensionLoaded()
    log('D', 'onExtensionLoaded', "Called")
end

local function onExtensionUnloaded()
    log('D', 'onExtensionUnloaded', "Called")
end

local function storeSettings(a, b, c, d, e, f, g, h, i, j)
    storedSettings = {
        id = a,
        minSpeed = b,
        maxSpeed = c,
        minAngle = d,
        maxAngle = e,
        speedChange = f,
        angleChange = g,
        settingsOpen = h,
        windLoop = i,
        verticalEnabled = j
    }
end

local function retrieveStoredSettings()
    guihooks.trigger('RetrieveSettings', storedSettings)

end

local function retrieveStoredLoop()
    guihooks.trigger('RetrieveLoop', storedLoop)
end

M.onExtensionLoaded = onExtensionLoaded
M.onExtensionUnloaded = onExtensionUnloaded

M.onGuiUpdate = onGuiUpdate

M.updateWind = updateWind
M.stopWind = stopWind
M.refreshWind = refreshWind

M.storeSettings = storeSettings
M.retrieveStoredSettings = retrieveStoredSettings

return M
