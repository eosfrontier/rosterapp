$(load)

var personfields = ['character_image','character_name','pilot_skill','pilot_interest']
var skillfields = ['pilot_skill','pilot_interest']
var specialfields = { character_image:'<img src="?">' }

function load()
{
    $.get('api/getroster.php', { fields: skillfields.join(','), extrafields: 'status' }, fillroster, 'json')
}

function htmlize(text)
{
    return text.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')
}

function rosterentry(entry)
{
    var html = ['<div class="roster-person" data-character-id="',entry.characterID,'">']
    for (var f = 0; f < personfields.length; f++) {
        pf = personfields[f]
        var text = entry[pf]
        var sf = specialfields[pf]
        if (sf) { text = sf.replace(/\?/, text) }
        html.push('<div class="roster-person-',pf,'">',text,'</div>')
    }
    html.push('</div>')
    return html.join('')
}

function fillroster(roster)
{
    var html = []
    for (var p = 0; p < roster.people.length; p++) {
        html.push(rosterentry(roster.people[p]))
    }
    $('#roster-list').html(html.join(''))
}
