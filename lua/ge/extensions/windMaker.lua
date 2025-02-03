local M = {}

local function randomValue(max)
    return max * math.random()
end

-- initial wind properties
local wind = {
    direction = {
        angle = randomValue(360),
        change = 0,
        gap = 0
    },
    speed = {
        speed = randomValue(70),
        change = 0,
        gap = 0
    }
}

local function onUpdate()
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
        local newAngle = wind.direction.angle + newChange
        if newAngle > 360 then
            newAngle = newAngle - 360
        end
        if newAngle < 0 then
            newAngle = 360 - newAngle
        end
        wind.direction.gap = newGap
        wind.direction.change = newChange
        wind.direction.angle = newAngle
    end
    local function changeSpeed()
        local gapDiff = (math.random() - 0.5) / 1000
        local newGap = gapDiff + wind.speed.gap
        local newChange = wind.speed.change + newGap
        if newChange > 0.005 then
            newChange = 0.005
            newGap = newGap * 0.9
        end
        if newChange < -0.005 then
            newChange = -0.005
            newGap = newGap * 0.9
        end
        local newSpeed = wind.speed.speed + newChange
        if newSpeed > 70 then
            newSpeed = 70
        end
        if newSpeed < 0 then
            newSpeed = 0
        end
        wind.speed.gap = newGap
        wind.speed.change = newChange
        wind.speed.speed = newSpeed
    end
    changeDirection()
    changeSpeed()
    local radians = math.pi / 180
    local xcoeff = math.sin(wind.direction.angle * radians)
    local ycoeff = math.cos(wind.direction.angle * radians)
    be:queueAllObjectLua('obj:setWind(' .. tostring(xcoeff * wind.speed.speed) .. "," ..
                             tostring(ycoeff * wind.speed.speed) .. ",0)")
end

function onInit()
    log("Wind generator running.")
end

M.onExtensionLoaded = onInit
M.onUpdate = onUpdate

return M
