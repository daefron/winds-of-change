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

local function updateWind(message)
    local function changeDirection()
        local gapDiff = (math.random() - 0.5) / 100
        local newGap = gapDiff + wind.direction.gap
        local newChange = wind.direction.change + newGap
        if newChange > 0.1 then
            newChange = 0.1
            newGap = newGap * 0.9
        end
        if newChange < -0.1 then
            newChange = -0.1
            newGap = newGap * 0.9
        end
        local newAngle = wind.direction.value + newChange
        if newAngle > 360 then
            newAngle = newAngle - 360
        end
        if newAngle < 0 then
            newAngle = 360 - newAngle
        end
        wind.direction.gap = newGap
        wind.direction.change = newChange
        wind.direction.value = newAngle
    end
    local function changeSpeed()
        local gapDiff = (math.random() - 0.5) / 100
        local newGap = gapDiff + wind.speed.gap
        local newChange = wind.speed.change + newGap
        if newChange > 0.05 then
            newChange = 0.05
            newGap = newGap * 0.9
        end
        if newChange < -0.05 then
            newChange = -0.05
            newGap = newGap * 0.9
        end
        local newSpeed = wind.speed.value + newChange
        if newSpeed > 65 then
            newSpeed = 65
        end
        if newSpeed < 0 then
            newSpeed = 0
        end
        wind.speed.gap = newGap
        wind.speed.change = newChange
        wind.speed.value = newSpeed
    end
    changeDirection()
    changeSpeed()
    local radians = math.pi / 180
    local xcoeff = math.sin(wind.direction.value * radians)
    local ycoeff = math.cos(wind.direction.value * radians)
    be:queueAllObjectLua('obj:setWind(' .. tostring(xcoeff * wind.speed.value) .. "," ..
                             tostring(ycoeff * wind.speed.value) .. ",0)")

    local speedData = wind.speed.value
    local directionData = wind.direction.value
    local data = speedData .. ":" .. directionData  
    guihooks.trigger('ReceiveData', data)

end

local function stopWind()
    wind = {
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
end

local function onExtensionLoaded()
    log('D', 'onExtensionLoaded', "Called")
end

local function onExtensionUnloaded()
    log('D', 'onExtensionUnloaded', 'Called')
end

M.onExtensionLoaded = onExtensionLoaded
M.onExtensionUnloaded = onExtensionUnloaded

M.updateWind = updateWind
M.stopWind = stopWind

return M
