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

    local function changeValue(type, typeChange)
        local windData = wind[type]
        local gap = windData.gap
        local change = windData.change
        local value = windData.value

        -- generate random adjustment for "flow"
        local randomAdjustment = ((math.random() - 0.5) / 100) * (typeChange / 10)

        local adjustedGap = gap + randomAdjustment
        local adjustedChange = change + adjustedGap

        -- max allowable change
        local maxChange = typeChange / 100

        -- clamps adjustedChange to stay within limits
        adjustedChange = math.max(math.min(adjustedChange, maxChange), -maxChange)

        -- reduces adjustedGap if clamp occurs to slow future changes
        if math.abs(adjustedChange) == maxChange then
            adjustedGap = adjustedGap * 0.9
        end

        -- initial update value
        local updatedValue = value + adjustedChange
        local clampedValue = updatedValue

        -- clamps updatedValue to stay within limits based on tmype
        if type == "direction" then
            -- keeps angle within standard angle range
            if maxAngle == 360 and minAngle == 0 then
                clampedValue = updatedValue % 360
            else
                clampedValue = math.max(math.min(updatedValue, maxAngle), minAngle)
            end
        elseif type == "speed" then
            clampedValue = math.max(math.min(updatedValue, maxSpeed), minSpeed)
        end

        -- inverts change direction if updatedValue clamped
        if clampedValue ~= updatedValue then
            adjustedGap = -adjustedGap
            adjustedChange = -adjustedChange
        end

        -- apply changes
        windData.gap = adjustedGap
        windData.change = adjustedChange
        windData.value = clampedValue
    end

    changeValue("direction", angleChange)
    local radians = math.pi / 180
    local radiansDirection = wind.direction.value * radians

    changeValue("speed", speedChange)
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
