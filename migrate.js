console.log('loaded migrate function\nPlease run migrate() in console')

var gMigrateFields = []
var gMigrateRosterCount = 0
function migrate()
{
    gMigrateFields = []
    gMigrateRosterCount = 0
    orthancv2('GET', 'meta', migrate_types, { 'meta_name': 'roster:type', 'all_characters': true })
}

function migrate_types(rosters)
{
    console.log('got old types:', rosters)
    gMigrateRosterCount = rosters.length
    for (var r = 0; r < rosters.length; r++) {
        var roster = rosters[r]
        var rtv = roster.value.split(':')
        var rid = rtv[0]
        if (rtv[2] != '') {
            rid = rtv[0]+'-'+rtv[2]
        }
        gMigrateFields.push({name: 'roster:'+rid, value: roster.value})
        orthancv2('GET', 'meta', migrate_roster, { 'id': rosters[r].character_id }, {rosterid: rid})
    }
    console.log('app data for rosters:', gMigrateFields)
}

function migrate_roster(roster)
{
    console.log('got old roster:', roster, this)
    var rid = this.rosterid
    for (var f = 0; f < roster.length; f++) {
        var field = roster[f]
        var fname = field.name
        if (fname == 'roster:type') continue
        fname = 'field:'+rid+':'+fname
        gMigrateFields.push({name: fname, value: field.value})
    }

    gMigrateRosterCount -= 1
    if (gMigrateRosterCount == 0) {
        console.log('saving', gMigrateFields)
        // save_rosters(gMigrateFields)
    }
}

function save_rosters(fields)
{
}
