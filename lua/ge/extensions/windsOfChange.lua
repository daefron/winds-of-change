local M = {}

local function onExtensionLoaded()
    log('D', 'onExtensionLoaded', "Called")
end

local function onExtensionUnloaded()
    log('D', 'onExtensionUnloaded', "Called")
end

-- helper function to generate initial/refreshed values for wind object
local function randomValue(max)
    return max * math.random()
end

-- object that stores last used wind data
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

-- object that stores last used settings
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

-- pre calcualated degree to radians conversion; used once per frame
local degToRad = math.pi / 180

-- updates current wind values; used once per frame
local function updateWind()
    -- cache stored settings
    local minSpeed = storedSettings.minSpeed
    local maxSpeed = storedSettings.maxSpeed
    local minAngle = storedSettings.minAngle
    local maxAngle = storedSettings.maxAngle
    local speedChange = storedSettings.speedChange
    local angleChange = storedSettings.angleChange
    local verticalEnabled = storedSettings.verticalEnabled

    -- stops function early if user has cleared setting field
    if minSpeed == nil or maxSpeed == nil or minAngle == nil or maxAngle == nil or speedChange == nil or angleChange ==
        nil then
        return
    end

    -- function that determines what value in next frame will be
    local function changeValue(type, typeChange)
        -- cache type data
        local windData = wind[type]
        local gap = windData.gap
        local change = windData.change
        local value = windData.value

        -- generate random adjustment 
        local adjustedGap = gap + ((math.random() - 0.5) / 100) * (typeChange / 10)
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
                updatedValue = clampedValue
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

    -- update direction and speed
    changeValue("direction", angleChange)
    changeValue("speed", speedChange)

    -- convert angle into radians
    local radiansDirection = wind.direction.value * degToRad

    -- convert speed from m/s into km/h
    local kmhSpeed = wind.speed.value / 3.6

    -- calculate vector coordinates
    local xValue = math.sin(radiansDirection) * kmhSpeed
    local zValue = math.cos(radiansDirection) * kmhSpeed
    local yValue = 0

    -- add vertical wind if enabled
    if (verticalEnabled) then
        yValue = zValue + xValue
    end

    -- queue changes to be sent to engine
    local windString = string.format("obj:setWind(%f, %f, %f)", xValue, zValue, yValue)
    be:queueAllObjectLua(windString)
end

-- updates the current wind values; used when user hits play while loop active
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

-- stores settings so not lost when state changes; used when any setting changed
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

-- sends stored settings back to UI
local function retrieveStoredSettings()
    guihooks.trigger('RetrieveSettings', storedSettings)

end

-- updates and sends wind data once per UI update if loop active
local function onGuiUpdate()
    if (storedSettings.windLoop) then
        updateWind()
        guihooks.trigger('ReceiveData', {wind.speed.value, wind.direction.value})
    end
end

-- stops wind; used when user clicks stop button
local function stopWind()
    -- stop wind in engine
    be:queueAllObjectLua('obj:setWind(0,0,0)')

    -- tell UI that speed and angle is 0
    guihooks.trigger('ReceiveData', {0, 0})
end

M.onExtensionLoaded = onExtensionLoaded
M.onExtensionUnloaded = onExtensionUnloaded
M.onGuiUpdate = onGuiUpdate
M.stopWind = stopWind
M.refreshWind = refreshWind
M.storeSettings = storeSettings
M.retrieveStoredSettings = retrieveStoredSettings

return M
