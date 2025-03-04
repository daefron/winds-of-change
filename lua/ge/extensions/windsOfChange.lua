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

local storedSettings = {0, 5, 20, 0, 360, 5, 5, false, false}
local storedLoop = false

local function updateWind(minAngle, maxAngle, minSpeed, maxSpeed, angleChange, speedChange)
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
        if newChange > speedChange / 200 then
            newChange = speedChange / 200
            newGap = newGap * 0.9
        end
        if newChange < speedChange / -200 then
            newChange = speedChange / -200
            newGap = newGap * 0.9
        end

        local newSpeed = wind.speed.value + newChange
        if newSpeed > maxSpeed then
            newSpeed = maxSpeed - (speedChange / 100)
            newGap = newGap * -1
            newChange = newChange * -1
        end
        if newSpeed < minSpeed then
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
    local direction = wind.direction.value
    local radiansDirection = direction * radians

    changeSpeed()
    local speed = wind.speed.value
    -- changes speed from m/s to km/h
    local kmhSpeed = speed / 3.6

    local xValue = math.sin(radiansDirection) * (kmhSpeed)
    local yValue = math.cos(radiansDirection) * (kmhSpeed)
    be:queueAllObjectLua('obj:setWind(' .. tostring(xValue) .. "," .. tostring(yValue) .. ",0)")

    local data = {speed, direction}
    guihooks.trigger('ReceiveData', data)
end

local function stopWind()
    be:queueAllObjectLua('obj:setWind(0,0,0)')
    storedLoop = false
    guihooks.trigger('ReceiveData', {0, 90})
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

local function storeSettings(a, b, c, d, e, f, g, h, i)
    storedSettings = {a, b, c, d, e, f, g, h, i}
end

local function retrieveStoredSettings()
    guihooks.trigger('RetrieveSettings', storedSettings)

end

local function retrieveStoredLoop()
    guihooks.trigger('RetrieveLoop', storedLoop)
end

M.onExtensionLoaded = onExtensionLoaded
M.onExtensionUnloaded = onExtensionUnloaded

M.updateWind = updateWind
M.stopWind = stopWind
M.refreshWind = refreshWind

M.storeSettings = storeSettings
M.retrieveStoredSettings = retrieveStoredSettings

return M
