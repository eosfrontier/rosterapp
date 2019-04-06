$(load)

var roster_type = 'pilot';
var person_fields = ['character_image','character_name','faction','rank','pilot_skill','pilot_interest']
var skill_fields = ['pilot_skill','pilot_interest']
var special_fields = { character_image:'<img src="?">' }
var special_fieldsnew = { character_image:'<div class="image-add-new">+</div>' }

function load()
{
    $.get('api/get_roster.php', { fields: skill_fields.join(','), extrafields: 'status' }, fill_roster, 'json')
    $.get('api/get_people.php', { }, fill_searchlist)
    $('#roster-list').on('click','div.roster-person.add-new',add_new_person)
    $('span.roster-type').text(roster_type)
}

function htmlize(text)
{
    return text.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')
}

function roster_entry(entry)
{
    var html = ['<div class="roster-person" data-character-id="',entry.characterID,'">']
    for (var f = 0; f < person_fields.length; f++) {
        pf = person_fields[f]
        var text = htmlize(entry[pf])
        var sf = special_fields[pf]
        if (sf) { text = sf.replace(/\?/, text) }
        html.push('<div class="roster-person-',pf,'">',text,'</div>')
    }
    html.push('</div>')
    return html.join('')
}

function roster_entry_new()
{
    var html = ['<div class="roster-person add-new">']
    for (var f = 0; f < person_fields.length; f++) {
        pf = person_fields[f]
        var text = ''
        var sf = special_fieldsnew[pf]
        if (sf) { text = sf.replace(/\?/, text) }
        html.push('<div class="roster-person-',pf,'">',text,'</div>')
    }
    html.push('</div>')
    return html.join('')
}

function fill_roster(roster)
{
    var html = []
    for (var p = 0; p < roster.people.length; p++) {
        html.push(roster_entry(roster.people[p]))
    }
    html.push(roster_entry_new())
    $('#roster-list').html(html.join(''))
}

function fill_searchlist(people)
{
    $('#search-person-list').html(people)
}

function add_new_person()
{
    $('#add-person-popup').addClass('visible')
}
