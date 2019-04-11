$(load)

var roster_type
var person_fields
var skill_fields
var extra_fields
var special_fields = { character_image:'<img src="?">' }
var special_fieldsnew = { character_image:'<div class="image-add-new">+</div>' }
var editable_fields
var search_value = ''

function load()
{
    roster_type = get_cookie('roster_type')
    if (roster_type) {
        $.get('api/get_roster.php', { roster_type: roster_type }, fill_roster, 'json')
    } else {
        $('#roster-list').text('')
    }
    $.get('api/get_roster.php', {}, fill_roster_types, 'json')
    $.get('api/get_people.php', { }, fill_searchlist, 'json')
    $('#roster-list').on('click','div.roster-person.add-new',search_new_person)
    $('span.roster-type').text(roster_type)
    $('#search-person-list').on('click','.search-person', add_new_person)
    $(document).click(hide_popups)
    $('#add-person-popup').click(function(e) { e.stopPropagation() })
    $('#search-input').on('input',input_searchlist)
    $('#search-input').on('keypress',keypress_searchlist)
    $('#roster-list').on('click','.roster-button-edit', edit_person)
    $('#roster-list').on('input','.editable > input', change_person_field)
    $('#roster-list').on('change','.editable.changed > input', save_person_field)
    $('#roster-list').on('click','.roster-button-delete', delete_person)

    $('.menu-button').click(show_menu)
    $('#headermenu-list').on('click', '.header-menu-roster_type', set_roster_type)
}

function fill_roster_types(roster_types)
{
    var html = []
    for (var t = 0; t < roster_types.roster_types.length; t++) {
        var rt = roster_types.roster_types[t]
        html.push('<div class="header-menu-roster_type menu-item" data-roster-type="',rt,'">',rt,' roster</div>')
    }
    $('#headermenu-list').html(html.join(''))
}

function set_roster_type()
{
    roster_type = $(this).attr('data-roster-type')
    $('span.roster-type').text(roster_type)
    set_cookie('roster_type', roster_type)
    $('#roster-list').text('Loading '+roster_type+' roster')
    $.get('api/get_roster.php', { roster_type: roster_type }, fill_roster, 'json')
    setTimeout(hide_popups, 0)
}

function show_menu(e)
{
    $(this).addClass('visible')
    e.stopPropagation()
}

function htmlize(text)
{
    if (!text) return ''
    return text.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')
}

function roster_entry(entry, doedit)
{
    var html = ['<div class="roster-person']
    if (doedit) { html.push(' editing') }
    html.push('" data-character-id="',entry.characterID,'">')
    for (var f = 0; f < person_fields.length; f++) {
        pf = person_fields[f]
        var text = htmlize(entry[pf])
        var sf = special_fields[pf]
        if (sf) { text = sf.replace(/\?/, text) }
        var ef = editable_fields[pf]
        ecls = ''
        if (ef) {
            ecls = ' editable'
            if (doedit) {
                text = '<input placeholder="'+ef+'" value="'+text+'">'
                if (skill_fields[pf]) {
                    ecls += ' initial'
                }
            }
        }
        html.push('<div data-field-name="',pf,'" class="roster-person-',pf,ecls,'">',text,'</div>')
    }
    html.push('<div class="roster-buttons"><div class="roster-button-edit button" title="Edit"></div>',
        '<div class="roster-button-delete button" title="Delete"></div></div>')
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
    person_fields = []
    skill_fields = {}
    editable_fields = {}
    for (var f = 0; f < roster.fields.length; f++) {
        var rf = roster.fields[f]
        if (rf.roster_order != 0) {
            person_fields.push(rf)
        }
        if (rf.roster_fieldtype == 1) {
            skill_fields[rf.fieldname] = true
        }
        if (!rf.field_external_table) {
            editable_fields[rf.fieldname] = rf.fieldlabel
        }
    }
    person_fields.sort(function(a,b) { a.roster_order - b.roster_order })
    for (var f = 0; f < person_fields.length; f++) {
        person_fields[f] = person_fields[f].fieldname
    }
    person_fields.unshift('character_name')
    person_fields.unshift('character_image')
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

function hide_popups()
{
    $('.menu-button').removeClass('visible')
    $('#add-person-popup').removeClass('visible')
}

function add_new_person()
{
    hide_popups()
    var item = $(this)
    var characterID = $(this).attr('data-character-id')
    if (characterID) {
        var newentry = $(roster_entry({
            characterID: characterID,
            character_name: $(this).find('.search-person-character_name').text(),
            character_image: 'https://www.eosfrontier.space/eos_douane/images/mugs/'+characterID+'.jpg',
            faction: $(this).find('.search-person-faction').text(),
            rank: $(this).find('.search-person-rank').text()
            }, true)).insertBefore('#roster-list .roster-person.add-new')
        $.get('api/get_roster.php', { roster_type: roster_type, characterID: characterID }, show_new_person, 'json')
    }
}

function show_new_person(roster)
{
    for (var p = 0; p < roster.people.length; p++) {
        var pp = roster.people[p]
        var entry = $("#roster-list .roster-person[data-character-id='"+pp.characterID+"']")
        for (var f = 0; f < person_fields.length; f++) {
            var pf = person_fields[f]
            var value = pp[pf]
            var field = entry.find("[data-field-name='"+pf+"']")
            var input = field.find('input')
            if (input.length == 1) {
                input.attr('value', value)
                if (value == '__deleted__') { value = '' }
                input.val(value)
            } else {
                if (value == '__deleted__') { value = '' }
                input.text(value)
            }
            if (value) {
                field.removeClass('initial')
            }
        }
        entry.find('input').each(save_person_field)
        entry.find('input').first().focus().select()
    }
}

function edit_person()
{
    var rp = $(this).closest('.roster-person')
    rp.find('.editable').each(function() {
        var text = $(this).text()
        var fieldname = $(this).attr('data-field-name')
        var ef = editable_fields[fieldname] || ''
        $(this).html('<input placeholder="'+ef+'" value="'+text+'">')
    })
    rp.addClass('editing')
    rp.find('input').first().focus().select()
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

function change_person_field()
{
    var field =$(this).closest('.editable')
    field.removeClass('saved')
    if ($(this).val() != $(this).attr('value')) {
        field.addClass('changed')
    } else {
        field.removeClass('changed')
    }
}

function save_person_field()
{
    var newvalue = $(this).val()
    var oldvalue = $(this).attr('value') || ''
    var field = $(this).closest('.editable')
    if (oldvalue != newvalue || field.hasClass('initial')) {
        var fieldname = field.attr('data-field-name')
        var characterID = field.closest('.roster-person').attr('data-character-id')
        if (characterID && fieldname) {
            $.post('api/save_roster_field.php', { characterID: characterID, fieldname: fieldname, oldvalue: oldvalue, newvalue: newvalue }, saved_person_field)
        }
    }
}

function saved_person_field(result)
{
    if (result.characterID) {
        var entry = $("#roster-list .roster-person[data-character-id='"+result.characterID+"']")
        var field = entry.find(".editable[data-field-name='"+result.fieldname+"']")
        if (result.error) {
            show_message(result.error, 'error')
            field.addClass('error')
        }
        if (result.result) {
            show_message(result.result, 'result')
        }
        if (!result.error) {
            if (result.fieldvalue == '__deleted__') {
                entry.addClass('deleted')
                field.text('')
            } else {
                var input = field.find("input")
                input.attr('value', result.fieldvalue)
                if (field.hasClass('initial')) {
                    field.removeClass('initial')
                } else {
                    field.addClass('saved')
                }
                if (input.val() == result.fieldvalue) {
                    field.removeClass('changed')
                } else {
                    field.addClass('changed')
                }
            }
        }
    }
}

function delete_person()
{
    var rp = $(this).closest('.roster-person')
    if (rp.length == 1) {
        var characterID = rp.attr('data-character-id')
        if (characterID) {
            var name = rp.find("[data-field-name='character_name']").text()
            if (!name) { name = rp.find("[data-field-name='character_name'] input").val() }
            if (confirm("Remove "+name+" from "+roster_type+" roster?")) {
                rp.find('.editable[data-field-name]').each(function() {
                    var fieldname = $(this).attr('data-field-name')
                    if (skill_fields[fieldname]) {
                        var oldvalue = ''
                        var input = $(this).find('input')
                        if (input.length == 1) {
                            oldvalue = input.attr('value')
                        } else {
                            oldvalue = $(this).text()
                        }
                        $.post('api/save_roster_field.php', { characterID: characterID, fieldname: fieldname, oldvalue: oldvalue, newvalue: '__deleted__' }, saved_person_field)
                    }
                })
            }
        }
    }
}

function show_message(message, messagetype)
{
}

function get_cookie(cookie)
{
    if (document.cookie) {
        var val = document.cookie.match('(^|;)\\s*'+cookie+'=([^;]*)')
        if (val) { return decodeURIComponent(val[2]) }
    }
    return ''
}

function set_cookie(cookie, value)
{
    var expir = new Date()
    expir.setYear(expir.getFullYear() + 1)
    document.cookie = cookie+'='+encodeURIComponent(value)+';expires='+expir.toUTCString()
}

