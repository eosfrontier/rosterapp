$(load)

var roster_type = 'pilot';
var person_fields = ['character_image','character_name','faction','rank','pilot_skill','pilot_interest']
var skill_fields = ['pilot_skill','pilot_interest']
var special_fields = { character_image:'<img src="?">' }
var special_fieldsnew = { character_image:'<div class="image-add-new">+</div>' }
var editable_fields = { pilot_skill: 'Pilot skill', pilot_interest: 'Interest in piloting' }
var search_value = ''

function load()
{
    $.get('api/get_roster.php', { fields: skill_fields.join(','), extrafields: 'status' }, fill_roster, 'json')
    $.get('api/get_people.php', { }, fill_searchlist)
    $('#roster-list').on('click','div.roster-person.add-new',search_new_person)
    $('span.roster-type').text(roster_type)
    $('#search-person-list').on('click','.search-person', add_new_person)
    $(document).click(hide_new_person)
    $('#add-person-popup').click(function(e) { e.stopPropagation() })
    $('#search-input').on('input',input_searchlist)
    $('#search-input').on('keypress',keypress_searchlist)
}

function htmlize(text)
{
    if (!text) return ''
    return text.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')
}

function roster_entry(entry, doedit)
{
    var html = ['<div class="roster-person" data-character-id="',entry.characterID,'">']
    for (var f = 0; f < person_fields.length; f++) {
        pf = person_fields[f]
        var text = htmlize(entry[pf])
        var sf = special_fields[pf]
        if (sf) { text = sf.replace(/\?/, text) }
        if (doedit) {
            var ef = editable_fields[pf]
            if (ef) { text = '<input placeholder="'+ef+'" value="'+text+'">' }
        }
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

function search_new_person()
{
    $('#search-person-list .search-person').addClass('selected')
    $('#search-person-list').removeClass('few-items')
    $('#search-input').val('')
    $('#roster-list .roster-person').each(function() {
        var characterID = $(this).attr('data-character-id')
        if (characterID) {
            $("#search-person-list .search-person[data-character-id='"+characterID+"']").addClass('exists')
        }
    })
    setTimeout(function() {
        $('#add-person-popup').addClass('visible')
        $('#search-input').focus()
        }, 0)
}

function hide_new_person()
{
    $('#add-person-popup').removeClass('visible')
}

function add_new_person()
{
    hide_new_person()
    var item = $(this)
    var characterID = $(this).attr('data-character-id')
    if (characterID) {
        $('#roster-list .roster-person.add-new').before(roster_entry({
            characterID: characterID,
            character_name: $(this).find('.search-person-character_name').text(),
            character_image: 'https://www.eosfrontier.space/eos_douane/images/mugs/'+characterID+'.jpg',
            faction: $(this).find('.search-person-faction').text(),
            rank: $(this).find('.search-person-rank').text()
            }, true))
    }
}

function input_searchlist()
{
    var searchkey = $('#search-input').val().toLowerCase()
    if (searchkey.indexOf(search_value) < 0) {
        $('#search-person-list .search-person').addClass('selected')
        $('#search-person-list').removeClass('few-items')
    }
    search_value = searchkey
    if (searchkey) {
        $('#search-person-list .search-person.selected').not("[data-search-key*='"+searchkey+"']").removeClass('selected')
        var selected_entries = $('#search-person-list .search-person.selected')
        if (selected_entries.length < 5) {
            $('#search-person-list').addClass('few-items')
            selected_entries.not(':has(.search-person-character_image img)').each(function() {
                console.log(this)
                var characterID = $(this).attr('data-character-id')
                if (characterID) {
                    $(this).find('.search-person-character_image').html('<img src="https://www.eosfrontier.space/eos_douane/images/mugs/'+characterID+'.jpg">')
                }
            })
        }
    }
}

function keypress_searchlist(e)
{
    if (e.which == 13) {
        var sellist = $('#search-person-list .search-person.selected:not(.exists)')
        if (sellist.length == 1) {
            sellist.click()
        }
    }
}
