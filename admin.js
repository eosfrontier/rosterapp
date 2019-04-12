$(load)

var special_fields = { roster_type:'<div class="image-field">?</div>' }
var field_types

function load()
{
    $.get('api/get_roster_list.php', {}, fill_roster_list, 'json')

    $('#roster-list').on('click','.roster-button-edit:not(.disabled)', edit_roster)
    $('#roster-list').on('click','.roster-button-delete:not(.disabled)', delete_roster)
    $('#roster-list').on('click','.roster-button-save:not(.disabled)', save_roster)
    $('#roster-list').on('change','.roster-field-roster_type input', start_new_roster)
    $('#roster-list').on('keypress','.roster-field-roster_type input', function(e) { if (e.which == 13) { start_new_roster.call(this) }})
    $('#roster-list').on('click','.roster-field',choose_skill_list)

    $('#add-field-popup').click(function(e) { e.stopPropagation() })
    $('#add-field-popup').on('click','.search-field:not(.exists)', select_field_entry)
    $('#add-field-popup').on('click','.search-field-edit', edit_search_field)
    $('#add-field-popup').on('keypress','.search-field input',  function(e) { if (e.which == 13) { $(this).click() }})

    $(document).click(hide_popups)
    $('.menu-button').click(show_menu)
    $('#headermenu-list').on('click', '.header-menu-roster_type', set_roster_type)
}

function fill_roster_list(roster_list)
{
    var mhtml = []
    var html = []
    field_types = roster_list.field_types
    for (var t = 0; t < roster_list.roster_types.length; t++) {
        var rt = roster_list.roster_types[t]
        mhtml.push('<div class="header-menu-roster_type menu-item" data-roster-type="',rt.roster_type,'">',rt.roster_type,' roster</div>')
        html.push(roster_entry(rt))
    }
    html.push(roster_entry({
        roster_type: "new type",
        fields: {
            'status': { 'order': 0, 'fieldtype': 0 }
        }
        }, true))
    $('#headermenu-list').html(mhtml.join(''))
    $('#roster-list').html(html.join(''))
    ftlist = []
    for (var f in field_types) {
        ftlist.push(f)
    }
    ftlist.sort(function(a,b) { return field_types[a].fieldlabel.localeCompare(field_types[b].fieldlabel) })
    html = []
    for (var f = 0; f < ftlist.length; f++) {
        var ft = ftlist[f]
        html.push('<div class="search-field" data-fieldname="',ft,'" title="',ft,'">',field_types[ft].fieldlabel,'</div>')
    }
    $('#search-field-list').html(html.join(''))
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

function roster_entry(entry, newroster)
{
    var html = ['<div class="roster-entry']
    if (newroster) { html.push(' new-roster') }
    html.push('" data-roster-id="',entry.rosterID,'">')
    html.push('<div class="roster-buttons"><div class="roster-button-edit button" title="Edit roster"></div>')
    html.push('<div class="roster-button-delete button',(newroster && ' disabled'),'" title="Delete roster"></div>')
    html.push('<div class="roster-button-save button disabled" title="Update / Store"></div></div>')
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
    html.push('<div class="roster-field-roster_type"><div class="field-box"><div class="field-text">')
    if (newroster) {
        html.push('<input placeholder="',htmlize(entry.roster_type),'">')
    } else {
        html.push(htmlize(entry.roster_type))
    }
    html.push('</div></div></div>')
    html.push('<div class="roster-field-roster_description">')
    if (newroster) {
    } else {
        html.push(htmlize(entry.roster_description))
    }
    html.push('</div>')
    for (var f = 0; f < roster_fields.length; f++) {
        var rf = roster_fields[f]
        var ef = entry.fields[roster_fields[f]]
        var ft = field_types[roster_fields[f]]
        var text = htmlize(ft.fieldlabel)
        var sf = special_fields[rf]
        if (sf) {
            text = sf.replace(/\?/, text)
        } else {
            if (ef.fieldtype > 0) {
                text = '&lt;'+text+'&gt;'
            } else {
                text = '['+text+']'
            }
        }
        var mand = (ef.fieldtype > 0 ? ' field-mandatory' : '')
        html.push('<div data-fieldname="',rf,'" class="roster-field-',rf,mand,'">',text,'</div>')
    }
    html.push('<div class="roster-field roster-new-field"></div>')
    html.push('</div>')
    return html.join('')
}

function hide_popups(e)
{
    if (!e || e.which == 1) {
        $('.menu-button').removeClass('visible')
        $('.add-popup').removeClass('visible')
    }
}

function start_new_roster()
{
    if ($('#roster-list .roster-entry.editing').length > 0) {
        return
    }
    var re = $(this).closest('.roster-entry')
    var typeval = re.find('.roster-field-roster_type input').val()
    if (typeval == "") {
        return
    }
    if (re.hasClass('new-roster')) {
        $('#roster-list .roster-button-edit').addClass('disabled')
        $('#roster-list .roster-entry').addClass('disabled')
        re.removeClass('new-roster disabled').addClass('editing')
        re.find('.roster-button-save').removeClass('disabled')
        var newinput = $('<input placeholder="Description of roster">')
        re.find('.roster-field-roster_description').html(newinput)
        newinput.focus()
        var ctypeval = typeval.charAt(0).toUpperCase()+typeval.slice(1)
        $('.search-field-default-skill').attr('data-fieldname', typeval+'_skill').find('input').val(ctypeval+' Skill')
        $('.search-field-default-interest').attr('data-fieldname', typeval+'_interest').find('input').val(ctypeval+' Interest')
        re.find('.roster-new-field').before(
            '<div class="roster-field-'+typeval+'_skill roster-field" data-fieldname="'+typeval+'_skill">['+ctypeval+' Skill]</div>'+
            '<div class="roster-field-'+typeval+'_interest roster-field field-mandatory" data-fieldname="'+typeval+'_interest">&lt;'+ctypeval+' Interest&gt;</div>')
    }
}

function edit_roster()
{
    if ($('#roster-list .roster-entry.editing').length > 0) {
        return
    }
    var re = $(this).closest('.roster-entry')
    var input = re.find('.roster-field-roster_type input')
    if (input.length > 0) {
        input.focus()
    } else {
        $('#roster-list .roster-button-edit').addClass('disabled')
        $('#roster-list .roster-entry').addClass('disabled')
        re.find('.roster-button-save').removeClass('disabled')
        re.find('[data-fieldname]').addClass('roster-field')
        re.removeClass('disabled').addClass('editing')
        $('#roster-list .roster-entry.disabled input').attr('disabled',true)
    }
}

function inputval_or_text(element)
{
    var input = element.find('input')
    if (input.length > 0) {
        return input.val()
    } else {
        return element.text()
    }
}

function save_roster()
{
    var re = $(this).closest('.roster-entry')
    var savefields = {
        'roster_type': inputval_or_text(re.find('.roster-field-roster_type .field-text')),
        'roster_description':inputval_or_text(re.find('.roster-field-roster_description'))
    }
    var ord = 1
    re.find('.roster-field[data-fieldname]').each(function() {
        var fieldtype = $(this).hasClass('field-mandatory') ? '1' : '0'
        savefields['field-'+$(this).attr('data-fieldname')] = ord+','+fieldtype
        ord++
    })
    $.post('api/save_roster.php', savefields, saved_roster)
    var savebutton = re.find('.roster-button-save')
    savebutton.addClass('disabled')
    // setTimeout(function() { savebutton.addClass('enabled') }, 5000)
}

function saved_roster(result)
{
    if (result.result) {
        $.get('api/get_roster_list.php', {}, fill_roster_list, 'json')
    }
}

function delete_roster()
{
    var re = $(this).closest('.roster-entry')
    alert("TODO: Delete")
}

function show_message(message, messagetype)
{
}

function choose_skill_list()
{
    $('#roster-list .roster-field.selecting').removeClass('selecting')
    $(this).addClass('selecting')
    $('#add-field-popup .search-field').removeClass('exists selected')
    var re = $(this).closest('.roster-entry')
    $('#search-field-mandatory').prop('checked', $(this).hasClass('field-mandatory'))
    re.find('.roster-field[data-fieldname]').each(function() {
        var fieldname = $(this).attr('data-fieldname')
        var cls = 'exists'
        if ($(this).hasClass('selecting')) { cls = 'selected' }
        $('#add-field-popup .search-field[data-fieldname="'+fieldname+'"]').addClass(cls)
    })
    setTimeout(function() { $('#add-field-popup').addClass('visible') }, 0)
}

function select_field_entry()
{
    var selecting = $('#roster-list .roster-field.selecting')
    if ($(this).hasClass('roster-field-empty')) {
        if (!selecting.hasClass('roster-new-field')) {
            selecting.remove()
        }
    } else {
        var fn = $(this).attr('data-fieldname')
        var input = $(this).find('input')
        var label
        if (input.length > 0) {
            label = input.val()
        } else {
            label = $(this).text()
        }
        var mandatory =$('#search-field-mandatory').prop('checked')
        if (mandatory) { 
            label = '<'+label+'>'
        } else {
            label = '['+label+']'
        }
        if (selecting.hasClass('roster-new-field')) {
            var cls = ''
            if (mandatory) { cls = ' field-mandatory' }
            selecting.before('<div class="roster-field-'+fn+cls+' roster-field" data-fieldname="'+fn+'">'+htmlize(label)+'</div>')
        } else {
            selecting.text(label)
            selecting.attr('data-fieldname', fn)
            if (mandatory) {
                selecting.addClass('field-mandatory')
            } else {
                selecting.removeClass('field-mandatory')
            }
        }
    }
    hide_popups()
}

function edit_search_field(e)
{
    $(this).closest('.search-field').find('input').focus().select()
    e.stopPropagation()
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
