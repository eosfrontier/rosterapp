$(load)

var special_fields = { roster_type:'<div class="image-field">?</div>', roster_description:'?' }
var special_fieldsnew = { roster_type:'<div class="image-add-new">+</div>', roster_description:'?' }

function load()
{
    $.get('api/get_roster_list.php', {}, fill_roster_list, 'json')
    /*
    $('#roster-list').on('click','div.roster-type.add-new',search_new_person)
    $('span.roster-type').text(roster_type)
    $('#search-person-list').on('click','.search-person', add_new_person)
    $('#add-person-popup').click(function(e) { e.stopPropagation() })
    $('#search-input').on('input',input_searchlist)
    $('#search-input').on('keypress',keypress_searchlist)
    $('#roster-list').on('click','.roster-button-edit', edit_person)
    $('#roster-list').on('input','.editable > input', change_person_field)
    $('#roster-list').on('change','.editable.changed > input', save_person_field)
    $('#roster-list').on('click','.roster-button-delete', delete_person)
    */

    $(document).click(hide_popups)
    $('.menu-button').click(show_menu)
    $('#headermenu-list').on('click', '.header-menu-roster_type', set_roster_type)
}

function fill_roster_list(roster_list)
{
    var mhtml = []
    var html = []
    for (var t = 0; t < roster_list.roster_types.length; t++) {
        var rt = roster_list.roster_types[t]
        mhtml.push('<div class="header-menu-roster_type menu-item" data-roster-type="',rt.roster_type,'">',rt.roster_type,' roster</div>')
        html.push(roster_entry(rt, roster_list.field_types))
    }
    $('#headermenu-list').html(mhtml.join(''))
    $('#roster-list').html(html.join(''))
}

function set_roster_type()
{
    roster_type = $(this).attr('data-roster-type')
    set_cookie('roster_type', roster_type)
    window.location = '../roster/'
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

function roster_entry(entry, field_types, doedit)
{
    var html = ['<div class="roster-person']
    if (doedit) { html.push(' editing') }
    html.push('" data-roster-id="',entry.rosterID,'">')
    var roster_fields = []
    for (var f in entry.fields) {
        if (entry.fields[f].order > 0) {
            roster_fields.push({fieldname:f,order:entry.fields[f].order})
        }
    }
    roster_fields.sort(function(a,b) { a.order - b.order })
    for (var f = 0; f < roster_fields.length; f++) {
        roster_fields[f] = roster_fields[f].fieldname
    }
    html.push('<div class="roster-field-roster_type"><div class="field-box"><div class="field-text">', htmlize(entry.roster_type), '</div></div></div>')
    html.push('<div class="roster-field-roster_description">', htmlize(entry.roster_description), '</div>')
    for (var f = 0; f < roster_fields.length; f++) {
        var rf = roster_fields[f]
        var ef = entry.fields[roster_fields[f]]
        var ft = field_types[roster_fields[f]]
        var text = htmlize(ft.fieldlabel)
        var sf = special_fields[rf]
        if (sf) { text = sf.replace(/\?/, text) }
        html.push('<div data-field-name="',rf,'" class="roster-field-',rf,'">&lt;',text,'&gt;</div>')
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

function search_new_field()
{
    $('#search-field-list .search-field').addClass('selected')
    $('#search-field-list').removeClass('few-items')
    $('#search-input').val('')
    /*
    $('#roster-list .roster-field').each(function() {
        var characterID = $(this).attr('data-character-id')
        if (characterID) {
            $("#search-field-list .search-field[data-character-id='"+characterID+"']").addClass('exists')
        }
    })
    */
    setTimeout(function() {
        $('#add-field-popup').addClass('visible')
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

