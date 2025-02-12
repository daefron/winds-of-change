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
        value = randomValue(40),
        change = 0,
        gap = 0
    }
}

local function updateWind(minSpeed, maxSpeed, minAngle, maxAngle, gapMult)
    local function changeDirection()
        local gapDiff = ((math.random() - 0.5) / 100) * (gapMult / 10)
        local newGap = gapDiff + wind.direction.gap
        local newChange = wind.direction.change + newGap
        if newChange > 0.1 * (gapMult / 10) then
            newChange = 0.1 * (gapMult / 10)
            newGap = newGap * 0.9
        end
        if newChange < -0.1 * (gapMult / 10) then
            newChange = -0.1 * (gapMult / 10)
            newGap = newGap * 0.9
        end
        local newAngle = wind.direction.value + newChange
        if newAngle > maxAngle then
            if maxAngle == 360 and minAngle == 0 then
                newAngle = newAngle - 360
            else
                newAngle = newAngle - 1
            end
        elseif newAngle < minAngle then
            if minAngle == 0 and maxAngle == 360 then
                newAngle = 360 - newAngle
            else
                newAngle = newAngle + 1
            end
        end
        wind.direction.gap = newGap
        wind.direction.change = newChange
        wind.direction.value = newAngle
    end
    local function changeSpeed()
        local gapDiff = ((math.random() - 0.5) / 100) * (gapMult / 10)
        local newGap = gapDiff + wind.speed.gap
        local newChange = wind.speed.change + newGap
        if newChange > 0.05 * (gapMult / 10) then
            newChange = 0.05 * (gapMult / 10)
            newGap = newGap * 0.9
        end
        if newChange < -0.05 * (gapMult / 10) then
            newChange = -0.05 * (gapMult / 10)
            newGap = newGap * 0.9
        end
        local newSpeed = wind.speed.value + newChange
        if newSpeed > maxSpeed then
            newSpeed = maxSpeed - 0.001
        end
        if newSpeed < minSpeed then
            newSpeed = minSpeed + 0.001
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
    log('D', 'onExtensionUnloaded', xcoeff)
    log('D', 'onExtensionUnloaded', ycoeff)
    be:queueAllObjectLua('obj:setWind(' .. tostring(xcoeff * (wind.speed.value / 3.57142857143)) .. "," ..
                             tostring(ycoeff * (wind.speed.value / 3.57142857143)) .. ",0)")

    local speedData = wind.speed.value
    local directionData = wind.direction.value
    local data = speedData .. ":" .. directionData
    guihooks.trigger('ReceiveData', data)

end

local function stopWind()
    be:queueAllObjectLua('obj:setWind(0,0,0)')
    local data = "0:90"
    guihooks.trigger('ReceiveData', data)
end

local function refreshWind()
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
    log('D', 'onExtensionUnloaded', "Called")
end

M.onExtensionLoaded = onExtensionLoaded
M.onExtensionUnloaded = onExtensionUnloaded

M.updateWind = updateWind
M.stopWind = stopWind
M.refreshWind = refreshWind

return M
