if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/roster/service-worker.js', {
    scope: '/roster/'
  }).then(function(reg) {
    if (reg.installing) {
      console.log('SW installing')
    } else if (reg.waiting) {
      console.log('SW installer')
    } else if (reg.active) {
      console.log('SW active')
    }
  }).catch(function(err) {
    console.error('SW registration failed: '+err)
  })
}
$(load)

var gRosters
var roster_type
var person_fields
var skill_fields
var extra_fields
var special_fields = { character_image:'<img src="https://www.eosfrontier.space/eos_douane/images/mugs/{{characterID}}.jpg">' }
var special_fieldsnew = { character_image:'<div class="image-add-new">+</div>' }
var editable_fields
var search_value = ''

$.postjson = function(url, data, callback) {
    $.ajax({
        'type': 'POST',
        'url': url,
        'contentType': 'application/json',
        'data': JSON.stringify(data),
        'dataType': 'json',
        'success': callback
    })
}

function load()
{
    roster_type = get_cookie('roster_type')
    $.get('api/get_roster.php', {}, fill_roster_types, 'json')
    $('#roster-list').on('click','.roster-entry.add-new',search_new_person)
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
    $('#roster-list').on('click',':not(.editing) .field-conflict-choice', edit_person)
    $('#roster-list').on('click','.field-conflict-save', save_conflict)

    $('.menu-button').click(show_menu)
    $('#headermenu-list').on('click', '.header-menu-roster_type', set_roster_type)
}

function fill_roster_types(rosters)
{
    gRosters = rosters
    var html = []
    for (var rt in rosters.rosters) {
        html.push('<div class="header-menu-roster_type menu-item" data-roster-type="',rt,'">',rt,' roster</div>')
    }
    $('#headermenu-list').html(html.join(''))
    fill_searchlist()
    if (roster_type) {
        fill_roster()
    }
}

function set_roster_type()
{
    roster_type = $(this).attr('data-roster-type')
    $('span.roster-type').text(roster_type)
    set_cookie('roster_type', roster_type)
    // $('#roster-list').text('Loading '+roster_type+' roster')
    // $.get('api/get_roster.php', { roster_type: roster_type }, fill_roster, 'json')
    fill_roster()
    setTimeout(hide_popups, 0)
}

function show_menu(e)
{
    $(this).addClass('visible')
    e.stopPropagation()
}

function htmlize(text)
{
    if (text == null) { return '' }
    return String(text).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')
}

function roster_entry(entry, doedit)
{
    if (!doedit) {
        for (var f in skill_fields) {
            if (entry[f] == null) {
                return
            }
        }
    }
    var html = ['<div class="roster-entry']
    if (doedit) { html.push(' editing') }
    html.push('" data-character-id="',entry.characterID,'">')
    html.push('<div class="roster-buttons"><div class="roster-button-edit button" title="Edit"></div>',
        '<div class="roster-button-delete button" title="Delete"></div></div>')
    for (var f = 0; f < person_fields.length; f++) {
        pf = person_fields[f]
        var text = entry[pf] || ''
        var ecls = ''
        var etitle = ''
        if (Array.isArray(text)) {
            text = '<div class="field-conflict-choice selected">'+text.map(htmlize).join('</div><div class="field-conflict-choice">')+'</div>'
            ecls += ' field-conflict'
            etitle = 'Conflicting edits, please resolve!'
        } else {
            text = htmlize(text)
        }
        var sf = special_fields[pf]
        if (sf) { text = sf.replace(/{{(.*?)}}/, function(v1, v2) { return entry[v2] }) }
        var ef = editable_fields[pf]
        if (ef) {
            ecls += ' editable'
            if (doedit) {
                if (entry[pf] == null) {
                    text = '<input type="text" placeholder="'+ef+'">'
                } else {
                    text = '<input type="text" placeholder="'+ef+'" value="'+text+'">'
                }
                if (skill_fields[pf]) {
                    ecls += ' initial'
                }
            }
        }
        html.push('<div data-field-name="',pf,'" class="roster-person-',pf,ecls,'" title="',etitle,'">',text,'</div>')
    }
    html.push('</div>')
    return html.join('')
}

function roster_entry_new()
{
    var html = ['<div class="roster-entry add-new">']
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

function fill_roster()
{
    person_fields = []
    skill_fields = {}
    editable_fields = {}
    var roster = gRosters.rosters[roster_type]
    for (var f = 0; f < roster.length; f++) {
        var rf = roster[f]
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
    for (var p = 0; p < gRosters.people.length; p++) {
        html.push(roster_entry(gRosters.people[p]))
    }
    html.push(roster_entry_new())
    $('#roster-list').html(html.join(''))
}

function fill_searchlist()
{
    var html = []
    for (var p = 0; p < gRosters.people.length; p++) {
        var entry = gRosters.people[p]
        html.push('<div class="selected search-person')
        if (entry['faction']) { html.push(' search-faction-',htmlize(entry['faction'])) }
        html.push('" data-character-index="',p,
            '" data-character-id="',htmlize(entry['characterID']),'" data-search-key="',
            htmlize(entry['character_name'].toLowerCase()),'">',
            '<div class="search-person-character_image"></div>',
            '<div class="search-person-character_name">',htmlize(entry['character_name']),'</div>',
            '<div class="search-person-faction">',htmlize(entry['faction']),'</div>',
            '<div class="search-person-rank">',htmlize(entry['rank']),'</div>',
            '</div>')
    }

    $('#search-person-list').html(html.join(''))
}

function search_new_person()
{
    $('#search-person-list .search-person').addClass('selected')
    $('#search-person-list').removeClass('few-items')
    $('#search-input').val('')
    $('#roster-list .roster-entry').each(function() {
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
    $('.add-popup').removeClass('visible')
}

function add_new_person()
{
    hide_popups()
    var item = $(this)
    var idx = $(this).attr('data-character-index')
    if (idx) {
        var newentry = $(roster_entry(gRosters.people[idx], true)).insertBefore('#roster-list .roster-entry.add-new')
        newentry.find('input').each(save_person_field)
        newentry.find('input').first().focus().select()
    }
}

function show_new_person(roster)
{
    for (var p = 0; p < roster.people.length; p++) {
        var pp = roster.people[p]
        var entry = $("#roster-list .roster-entry[data-character-id='"+pp.characterID+"']")
        for (var f = 0; f < person_fields.length; f++) {
            var pf = person_fields[f]
            var value = pp[pf]
            var field = entry.find("[data-field-name='"+pf+"']")
            var input = field.find('input')
            if (input.length == 1) {
                input.attr('value', value)
                if (value == null) { value = '' }
                input.val(value)
            } else {
                if (value == null) { value = '' }
                input.text(value)
            }
            if (value) {
                field.removeClass('initial')
            }
        }
    }
}

function edit_person()
{
    var rp = $(this).closest('.roster-entry')
    var cfv = null
    if ($(this).hasClass('field-conflict-choice')) {
        cfv = this
    }
    var conflict = false
    var characterID = rp.attr('data-character-id')
    rp.find('.editable.field-conflict').each(function() {
        var ediv = $(this)
        var fieldname = ediv.attr('data-field-name')
        var ef = editable_fields[fieldname] || ''
        var html = []
        var checked = 'checked'
        if (cfv) {
            checked = ''
        }
        var cnt = 1
        ediv.find('div').each(function() {
            var text = htmlize($(this).text())
            if (cfv && cfv == this) {
                checked = 'checked'
            }
            var id = characterID+'-'+fieldname+'-'+cnt
            html.push('<div class="field-conflict-choose"><input type="radio" data-fieldvalue="',text,'" ',
                'name="',characterID,'-',fieldname,'" ',checked,' id="',id,'">',
                '<label for="',id,'">',text,'</label></div>')
            checked = ''
            cnt += 1
        })
        html.push('<div class="field-conflict-save" title="Resolve conflict"></div>')
        ediv.html(html.join(''))
        conflict = true
    })
        
    if (!conflict) {
        rp.find('.field-conflict-resolved').removeClass('field-conflict-resolved')
        rp.find('.editable').each(function() {
            var ediv = $(this)
            var fieldname = ediv.attr('data-field-name')
            var ef = editable_fields[fieldname] || ''
            var text = ediv.text()
            ediv.html('<input type="text" placeholder="'+ef+'" value="'+text+'">')
        })
        rp.find('input').first().focus().select()
    }
    rp.addClass('editing')
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
    var oldvalue = $(this).attr('value')
    if (oldvalue == null) { oldvalue = null }
    if (newvalue == null) { newvalue = null }
    var field = $(this).closest('.editable')
    if (oldvalue != newvalue || field.hasClass('initial')) {
        var fieldname = field.attr('data-field-name')
        var characterID = field.closest('.roster-entry').attr('data-character-id')
        console.log(characterID, fieldname, oldvalue, newvalue, this)
        if (characterID && fieldname) {
            $.postjson('api/save_roster_field.php', { characterID: characterID, fieldname: fieldname, oldvalue: oldvalue, newvalue: newvalue }, saved_person_field)
        }
    }
}

function saved_person_field(result)
{
    if (result.characterID) {
        var entry = $("#roster-list .roster-entry[data-character-id='"+result.characterID+"']")
        var field = entry.find(".editable[data-field-name='"+result.fieldname+"']")
        if (result.error) {
            show_message(result.error, 'error')
            field.addClass('error')
        }
        if (result.result) {
            show_message(result.result, 'result')
            if (result.newvalue == null) {
                if (field.hasClass('field-conflict')) {
                    field.find(".field-conflict-choose:has(input[data-fieldvalue='"+result.oldvalue+"'])").remove()
                    if (field.find('.field-conflict-choose').length <= 1) {
                        field.removeClass('field-conflict').addClass('field-conflict-resolved').attr('title','')
                    }
                    if (entry.find('.field-conflict').length < 1) {
                        entry.removeClass('editing')
                    }
                } else {
                    entry.addClass('deleted')
                    field.text('')
                }
            } else {
                var input = field.find("input")
                var fv = result.fieldvalue
                input.attr('value', fv)
                if (field.hasClass('initial')) {
                    field.removeClass('initial')
                } else {
                    field.addClass('saved')
                }
                if (input.val() == fv) {
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
    var rp = $(this).closest('.roster-entry')
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
                        $.postjson('api/save_roster_field.php', { characterID: characterID, fieldname: fieldname, oldvalue: oldvalue, newvalue: null }, saved_person_field)
                    }
                })
            }
        }
    }
}

function save_conflict()
{
    var fc = $(this).closest('.field-conflict')
    var fieldname = fc.attr('data-field-name')
    var characterID = fc.closest('.roster-entry').attr('data-character-id')
    fc.find('.field-conflict-choose input:not(:checked)').each(function() {
        var oldvalue = $(this).attr('data-fieldvalue')
        $.postjson('api/save_roster_field.php', { characterID: characterID, fieldname: fieldname, oldvalue: oldvalue, newvalue: null }, saved_person_field)
    })
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

