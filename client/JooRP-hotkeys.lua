script_name('Joo RP hotkeys')
script_author('Joo RP')

local keys = require 'vkeys'

function main()
    while not isSampAvailable() do wait(100) end
    while true do
        wait(0)
        if isKeyJustPressed(keys.VK_P)
            and not sampIsChatInputActive()
            and not sampIsDialogActive()
            and not sampIsCursorActive() then
            sampSendChat('/phone')
        end
    end
end
