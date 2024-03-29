var default_field_types = {
   "roster:character:faction": { fieldlabel: "Faction", field_external_table: true },
   "roster:character:rank": { fieldlabel: "Rank", field_external_table: true }
}

var gMyCharID = 0
var gAdminList = []
var gAccountACL = []
var gIsAdmin = false
var special_fields = { roster_type:'<div class="image-field">?</div>' }
var field_types
var roster_field_types = {}
var clienttoken

var adminusers = [818]
var admingroups = [8,30]

function load(idandtoken)
{
    initialize_api(idandtoken)
    clienttoken = idandtoken.token
    if (!clienttoken) { return }
    $('#nologin').remove()
    var accountid = parseInt(idandtoken.id)
    if (adminusers.indexOf(accountid) >= 0) {
        add_adminbutton()
    } else {
        for (var i = 0; i < admingroups.length; i++) {
            if (idandtoken.groups[admingroups[i]]) {
                add_adminbutton()
                break
            }
        }
    }
    get_accountid(accountid, get_my_charid)
    get_types(fill_roster_list)

    $('#roster-list').on('click','.roster-button-edit:not(.disabled)', edit_roster)
    $('#roster-list').on('click','.roster-button-undo:not(.disabled)', undo_roster)
    $('#roster-list').on('click','.roster-button-delete:not(.disabled)', delete_roster)
    $('#roster-list').on('click','.roster-button-save:not(.disabled)', save_roster)
    $('#roster-list').on('change','.roster-field-roster_type input', start_new_roster)
    $('#roster-list').on('keypress','.roster-field-roster_type input', function(e) { if (e.which == 13) { start_new_roster.call(this) } })
    $('#roster-list').on('keydown','.roster-field-roster_type .field-text.duplicate input', function() { $('.field-text.duplicate').removeClass('duplicate') })
    $('#roster-list').on('click','.roster-field',choose_skill_list)

    $('#roster-list').on('click','.new-roster:not(.editing)', function() { $(this).find('.roster-field-roster_type input').focus().select() })
    $('#roster-list').on('click','.roster-field-radiobutton', set_field_mandatory)

    $('#add-field-popup').click(function(e) { e.stopPropagation() })
    $('#add-field-popup').on('click','.search-field:not(.exists)', select_field_entry)
    $('#add-field-popup').on('click','.search-field:not(.exists) .search-field-edit', edit_search_field)
    $('#add-field-popup').on('keypress','.search-field input',  function(e) { if (e.which == 13) { $(this).blur().click() }})
    $('#add-field-popup').on('keypress','.search-field-new input',  function(e) { if (e.which == 13) { add_new_search_field.call(this) }})

    $('#add-field-popup').on('click','.search-field-new-button', add_new_search_field)

    $(document).click(hide_popups)
    $('.menu-button').click(show_menu)
    // $('#headermenu-list').on('click', '.header-menu-roster_type', set_roster_type)
    $(window).on('hashchange', function() { if (window.location.hash != '#select') { $('.add-popup').removeClass('visible') } })
}

function set_admin()
{
    if (gIsAdmin) {
        gIsAdmin = false
        $('#admin_button').removeClass('isadmin')
        $('#roster-list > .roster-entry > .roster-buttons').removeClass('roster-buttons').addClass('roster-buttons-disabled').html('')
        set_accountacl()
    } else {
        gIsAdmin = true
        $('#admin_button').addClass('isadmin')
        $('#roster-list > .roster-entry > .roster-buttons-disabled').addClass('roster-buttons').removeClass('roster-buttons-disabled').html(
            '<div class="roster-button-edit button" title="Edit roster"></div>'+
            '<div class="roster-button-delete button" title="Delete roster"></div>'+
            '<div class="roster-button-save button disabled" title="Update / Store"></div>')
    }
}

function add_adminbutton()
{
    $('#footerframe').prepend('<div id="admin_button" title="Application Admin"></div>')
    $('#admin_button').click(set_admin)
}

function get_my_charid(chardata)
{
    gMyCharID = chardata.characterID
    get_accountacl()
}

function get_accountacl()
{
    if (gMyCharID && (gAdminList.length > 0)) {
        get_character_meta(gMyCharID, gAdminList, set_accountacl)
    }
}

function set_accountacl(acl)
{
    if (acl) {
        gAccountACL = acl
    }
    for (var i = 0; i < gAccountACL.length; i++) {
        var acle = gAccountACL[i]
        if (acle.value == "owner") {
            var acln = acle.name.split(':')
            if (acln[0] == 'roster' && acln[1] == 'admin') {
                var aclid = parseInt(acln[2])
                $('#roster-list > .roster-entry[data-roster-id="'+aclid+'"] > .roster-buttons-disabled').addClass('roster-buttons').removeClass('roster-buttons-disabled').html(
                    '<div class="roster-button-edit button" title="Edit roster"></div>'+
                    '<div class="roster-button-delete button" title="Delete roster"></div>'+
                    '<div class="roster-button-save button disabled" title="Update / Store"></div>')
            }
        }
    }
}

function fill_roster_list(roster_list)
{
    var mhtml = []
    var html = []
    field_types = $.extend(true, {}, default_field_types)
    roster_field_types = {}
    gAdminList = []
    for (var t = 0; t < roster_list.length; t++) {
        var rid = roster_list[t].character_id
        var rtent = roster_list[t].value.split(':')
        var rt = {
            rosterID: rid,
            roster_type: rtent[0],
            roster_flags: rtent[1],
            roster_description: rtent.slice(2).join(':').replace(/^:/,''),
            fields: {
                'status': { 'order': 0, 'fieldtype': 0 }
            }
        }
        var roster_label = 'roster'
        if (rtent[2] != '') { roster_label = rtent[2] }
        mhtml.push('<a class="header-menu-roster_type menu-item" href="../roster/#',rt.rosterID,'">',rt.roster_type,' ',roster_label,'</div>')
        html.push(roster_entry(rt))
        get_roster_meta(rid, fill_roster_entry)
        gAdminList.push('roster:admin:'+rid)
    }
    get_accountacl()
    html.push(roster_entry({
        roster_type: "new type",
        fields: {
            'status': { 'order': 0, 'fieldtype': 0 }
        }
        }, true))
    $('#headermenu-list').html(mhtml.join(''))
    $('#roster-list').html(html.join(''))
    $('#roster-list .roster-entry > .roster-field-roster_type .field-text').each(function() {
        var w = 100/$(this).width()
        if (w > 1.2) w = 1.2
        $(this).css('transform', 'rotate(-32deg) scale('+w+')')
    })
}

function fill_roster_entry(fields)
{
    var rid = this.id
    var rt = { rosterID: rid, fields: {} }
    roster_field_types[rid] = {}
    for (var f = 0; f < fields.length; f++) {
        var entry = fields[f]
        var rtent = entry.value.split(':')
        roster_field_types[rid][entry.name] = entry.value
        if (entry.name == 'roster:type') {
            rt['roster_type'] = rtent[0]
            rt['roster_flags'] = rtent[1]
            rt['roster_description'] = rtent.slice(2).join(':').replace(/^:/,'')
        } else {
            var rtnm = entry.name.split(':')
            var external = false
            if (rtnm.length > 2) {
                external = true
            }
            rt.fields[entry.name] = {
                order: parseInt(rtent[0]),
                fieldtype: rtent[1]
            }
            field_types[entry.name] = {
                fieldlabel: rtent.slice(2).join(':'),
                field_external_table: external
            }
        }
    }
    $('#roster-list .roster-entry[data-roster-id="'+rid+'"]').replaceWith(roster_entry(rt))
    var re = $('#roster-list .roster-entry[data-roster-id="'+rid+'"] > .roster-field-roster_type .field-text')
    var w = 100/re.width()
    if (w > 1.2) w = 1.2
    re.css('transform', 'rotate(-32deg) scale('+w+')')
    fill_fields()
}

function fill_fields()
{
    ftlist = []
    for (var f in field_types) {
        ftlist.push(f)
    }
    ftlist.sort(function(a,b) {
        return field_types[b].field_external_table - field_types[a].field_external_table ||
        field_types[a].fieldlabel.localeCompare(field_types[b].fieldlabel)
        })
    html = []
    for (var f = 0; f < ftlist.length; f++) {
        var ft = ftlist[f]
        var cls = 'search-field'
        if (field_types[ft].field_external_table) {
            cls += ' search-field-external'
        }
        html.push('<div class="',cls,'" data-fieldname="',ft,'" title="',ft,'">',field_types[ft].fieldlabel,'</div>')
    }
    $('#search-field-list').html(html.join(''))
    set_accountacl()
}

/*
function set_roster_type()
{
    roster_id = $(this).attr('data-roster-id')
    set_cookie('roster_id', roster_id)
    window.location = '../roster/'
}
*/

function show_menu(e)
{
    $(this).toggleClass('visible')
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
    var roster_fields = []
    for (var f in entry.fields) {
        if (entry.fields[f].order > 0) {
            roster_fields.push({fieldname:f,order:entry.fields[f].order})
        }
    }
    roster_fields.sort(function(a,b) { return a.order - b.order })
    for (var f = 0; f < roster_fields.length; f++) {
        roster_fields[f] = roster_fields[f].fieldname
    }
    html.push('<div class="roster-field-roster_type"><div class="field-box"><div class="field-text">')
    if (newroster) {
        html.push('<input type="text" placeholder="',htmlize(entry.roster_type),'" maxlength="12" pattern="[A-Za-z][A-Za-z][A-Za-z]+">')
    } else {
        html.push(htmlize(entry.roster_type))
    }
    html.push('</div></div></div>')
    html.push('<div class="roster-buttons'+(newroster ? '' : '-disabled')+'">')
    if (newroster) {
        html.push('<div class="roster-button-edit button" title="Edit roster"></div>')
        html.push('<div class="roster-button-delete button',(newroster && ' disabled'),'" title="Delete roster"></div>')
        html.push('<div class="roster-button-save button disabled" title="Update / Store"></div>')
    }
    html.push('</div>')
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
            text = '&lt;'+text+'&gt;'
        }
        var cls = 'roster-field-'+rf
        if (ef.fieldtype.indexOf('P') >= 0) { cls += ' field-mandatory' }
        if (ft.field_external_table) { cls += ' field-external' }
        else if ($('#roster-list .roster-entry:not(.editing) div[data-fieldname="'+rf+'"]').length == 0) { cls += ' field-normal' }
        html.push('<div data-fieldname="',rf,'" data-fieldtype="',ef.fieldtype,'" class="',cls,'"><div class="roster-field-radiobutton"></div>',text,'</div>')
    }
    html.push('<div class="roster-field roster-new-field"></div>')
    html.push('</div>')
    return html.join('')
}

function hide_popups(e)
{
    if (!e || e.which == 1) {
        var doback = $('.add-popup').hasClass('visible')
        $('.menu-button').removeClass('visible')
        $('.add-popup').removeClass('visible')
        if (doback) { window.history.back() }
    }
}

function capitalize(text)
{
    return text.charAt(0).toUpperCase()+text.slice(1)
}

function start_new_roster()
{
    var re = $(this).closest('.roster-entry')
    var rtfield = re.find('.roster-field-roster_type .field-text')
    var typeval = rtfield.find('input').val().toLowerCase()
    if (typeval == "") {
        return
    }
    var ctypeval = capitalize(typeval)
    if (re.hasClass('editing')) {
        var oldtype = re.attr('data-roster-type')
        if (oldtype) {
            re.attr('data-roster-type', typeval)
            $('.roster-entry [data-fieldname="roster:'+oldtype+'_skill"]').attr('data-fieldname','roster:'+typeval+'_skill').find('span').text(ctypeval+' Skill')
            $('.roster-entry [data-fieldname="roster:'+oldtype+'_interest"]').attr('data-fieldname','roster:'+typeval+'_interest').find('span').text(ctypeval+' Interest')
            $('.search-field[data-fieldname="roster:'+oldtype+'_skill"]').attr('data-fieldname','roster:'+typeval+'_skill').find('input[type="text"]').val(ctypeval+' Skill')
            $('.search-field[data-fieldname="roster:'+oldtype+'_interest"]').attr('data-fieldname','roster:'+typeval+'_interest').find('input[type="text"]').val(ctypeval+' Interest')
        }
        return
    }
    if ($('#roster-list .roster-entry.editing').length > 0) {
        return
    }
    if ((typeval.length > 12) || (!typeval.match(/^[a-z][a-z][a-z]+$/))) {
        rtfield.addClass('duplicate')
        return
    }
    $('.duplicate').removeClass('duplicate')
    var dups = $('#roster-list .roster-field-roster_type .field-text').filter(function(i, el) { return $(el).text() == typeval })
    if (dups.length > 0) { 
        dups.addClass('duplicate')
        rtfield.addClass('duplicate')
        return
    }
    if (re.hasClass('new-roster')) {
        re.attr('data-roster-type',typeval)
        re.find('.roster-button-edit').removeClass('roster-button-edit').addClass('roster-button-undo')
        $('#roster-list .roster-button-edit').addClass('disabled')
        $('#roster-list .roster-entry').addClass('disabled')
        re.removeClass('disabled').addClass('editing')
        re.find('.roster-button-save').removeClass('disabled')
        var newinput = $('<input type="text" placeholder="Description of roster">')
        re.find('.roster-field-roster_description').html(newinput)
        newinput.focus()
        $('.search-field-default-skill').attr('data-fieldname', 'roster:'+typeval+'_skill').find('input').val(ctypeval+' Skill')
        $('.search-field-default-interest').attr('data-fieldname', 'roster:'+typeval+'_interest').find('input').val(ctypeval+' Interest')
        re.find('.roster-new-field').before(
            '<div class="roster-field-'+typeval+'_skill roster-field field-normal" data-fieldname="roster:'+typeval+'_skill">'+
            '<div class="roster-field-radiobutton"></div><span>&lt;'+ctypeval+' Skill&gt;</span></div>'+
            '<div class="roster-field-'+typeval+'_interest roster-field field-mandatory field-normal" data-fieldname="roster:'+typeval+'_interest">'+
            '<div class="roster-field-radiobutton"></div><span>&lt;'+ctypeval+' Interest&gt;</span></div>')
        set_sortable(re)
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
        re.find('.roster-button-edit').removeClass('roster-button-edit').addClass('roster-button-undo')
        $('#roster-list .roster-button-edit').addClass('disabled')
        $('#roster-list .roster-entry').addClass('disabled')
        var rd = re.find('.roster-field-roster_description')
        if (rd.find('input').length == 0) {
            rd.html('<input type="text" placeholder="Description of roster" value="'+htmlize(rd.text())+'">')
        }
        re.find('.roster-button-save').removeClass('disabled')
        re.find('[data-fieldname]').addClass('roster-field')
        re.removeClass('disabled').addClass('editing')
        $('#roster-list .roster-entry.disabled input').attr('disabled',true)
        set_sortable(re)
    }
}


function set_sortable(re)
{
    re.sortable({
        items: '.roster-field:not(.roster-new-field)',
        cursor: 'move',
        helper: 'clone',
        appendTo: 'body',
        revert: 250,
        out: function(e, ui) {
            if (ui.helper) {
                ui.helper.addClass('field-remove')
                ui.item.addClass('field-remove')
            }
        },
        over: function(e, ui) {
            if (ui.helper) {
                ui.helper.removeClass('field-remove')
                ui.item.removeClass('field-remove')
            }
        },
        stop: function(e, ui) {
            if (ui.item.hasClass('field-remove')) {
                if (ui.helper) { ui.helper.addClass('field-remove-now') }
                ui.item.remove()
            }
        },
        start: function(e, ui) {
            ui.helper.one('mouseup', function() {
                $(this).addClass('field-remove-now')
            })
        }
    })
}

function undo_roster()
{
    var re = $(this).closest('.roster-entry')
    if (re) {
        get_types(fill_roster_list)
        re.addClass('disabled')
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
    save_roster_entry.apply(this)
}

function save_roster_entry(rids)
{
    if (!gMyCharID) return
    var re = $(this).closest('.roster-entry')
    if (re.find('.roster-field.field-mandatory[data-fieldname]').length == 0) {
        alert('Primary field required')
        return
    }
    var addowner = false
    var roster_type = inputval_or_text(re.find('.roster-field-roster_type .field-text'))
    var roster_desc = inputval_or_text(re.find('.roster-field-roster_description')) || (roster_type+' roster')
    if (!roster_desc.match(/^[a-z]+:/)) { roster_desc = ':'+roster_desc }
    var rosterID = re.attr('data-roster-id')
    if (!rosterID) {
        if (!gIsAdmin) addowner = true
        if (!rids) {
            // Fetch list of existing rosters, then rerun this function
            get_types(save_roster_entry, this)
            return
        } else {
            // List of existing rosters was fetched, determine new id
            rosterID = -1
            for (var r = 0; r < rids.length; r++) {
                if (rids[r].character_id <= rosterID) {
                    rosterID = rids[r].character_id - 1
                }
            }
        }
    }
    $('#add-field-popup .search-field input').each(function() {
        var input = $(this)
        var sf = input.closest('.search-field')
        var fieldname = sf.attr('data-fieldname')
        if (fieldname) {
            if (!field_types[fieldname]) {
                field_types[fieldname] = {}
            }
            field_types[fieldname].fieldlabel = (input.val() || fieldname.replace(/_/g,' '))
        }
    })
    var old_fields = {}
    if (roster_field_types[rosterID]) {
        for (var f in roster_field_types[rosterID]) {
            old_fields[f] = roster_field_types[rosterID][f]
        }
    }
    var savefields = [
        { "name": "roster:type", "value": roster_type+'::'+roster_desc, 'old_value': old_fields['roster:type'] }
    ]
    delete old_fields['roster:type']
    var ord = 1
    re.find('.roster-field[data-fieldname]').each(function() {
        var fieldtype = []
        var dfieldtype = $(this).attr('data-fieldtype')
        if (dfieldtype) {
            fieldtype = $.grep(dfieldtype.split(','), function(d) { return d[0] != 'P' })
        }
        if ($(this).hasClass('field-mandatory')) {
            fieldtype.unshift('P')
        }
        var fieldname = $(this).attr('data-fieldname')
        var fieldlabel = fieldname
        if (field_types[fieldname] && field_types[fieldname].fieldlabel) {
            fieldlabel = field_types[fieldname].fieldlabel
        }
        savefields.push({ 'name':fieldname, 'value':ord+':'+fieldtype+':'+fieldlabel, 'old_value': old_fields[fieldname] })
        delete old_fields[fieldname]
        ord++
    })
    var fields_todelete = []
    for (var of in old_fields) {
        fields_todelete.push({'name': of, 'value': old_fields[of]})
    }
    if (fields_todelete.length > 0) {
        delete_roster_meta(rosterID, fields_todelete, cleaned_roster)
    }
    if (!addowner) {
        save_roster_meta(rosterID, savefields, saved_roster)
    } else {
        save_character_meta(gMyCharID, 'roster:admin:'+rosterID, null, 'owner', function() {
            save_roster_meta(rosterID, savefields, saved_roster)
        })
    }
    var savebutton = re.find('.roster-button-save')
    savebutton.addClass('disabled')
}

function cleaned_roster(result)
{
    /* Ignore */
}

function saved_roster(result)
{
    get_types(fill_roster_list)
}

function delete_roster()
{
    var re = $(this).closest('.roster-entry')
    alert("TODO: Delete")
}

function show_message(message, messagetype)
{
}

function set_field_mandatory()
{
    var fe = $(this).closest('.roster-field')
    var re = fe.closest('.roster-entry')
    re.find('.roster-field.field-mandatory').removeClass('field-mandatory')
    fe.addClass('field-mandatory')
    return false
}

function choose_skill_list()
{
    $('#roster-list .roster-field.selecting').removeClass('selecting')
    $(this).addClass('selecting')
    $('#add-field-popup .search-field').removeClass('exists selected')
    var re = $(this).closest('.roster-entry')
    re.find('.roster-field[data-fieldname]').each(function() {
        var fieldname = $(this).attr('data-fieldname')
        var cls = 'exists'
        if ($(this).hasClass('selecting')) { cls = 'selected' }
        $('#add-field-popup .search-field[data-fieldname="'+fieldname+'"]').addClass(cls)
    })
    if (re.find('.roster-field.field-normal').length < 2) {
        $('#add-field-popup .search-field.roster-field-empty').addClass('exists')
    } else {
        $('#add-field-popup .search-field.roster-field-empty').removeClass('exists')
    }
    var fieldname = $(this).attr('data-fieldname')
    $('#add-field-popup .search-field input').attr('readonly',true)
    if (fieldname) {
        $('#add-field-popup .search-field[data-fieldname="'+fieldname+'"] input').attr('readonly',false)
        setTimeout(function() { $('#add-field-popup .search-field[data-fieldname="'+fieldname+'"] input').focus().select() }, 50)
    }
    setTimeout(function() {
        if (!$('#add-field-popup').hasClass('visible')) { window.location.hash = '#select' }
        $('#add-field-popup').addClass('visible')
        }, 0)
}

function select_field_entry()
{
    var entry = $(this)
    var selecting = $('#roster-list .roster-field.selecting')
    if (entry.hasClass('roster-field-empty')) {
        if (!selecting.hasClass('roster-new-field')) {
            var re = selecting.closest('.roster-entry')
            if (re.find('.roster-field.field-normal').length >= 2) {
                selecting.remove()
                if (re.find('.roster-field.field-normal.field-mandatory').length == 0) {
                    re.find('.roster-field.field-normal').first().addClass('field-mandatory')
                }
            }
        }
    } else {
        var re = selecting.closest('.roster-entry')
        var fn = entry.attr('data-fieldname')
        var input = entry.find('input')
        var label
        if (input.length > 0) {
            if (input.is(':focus') && !input.attr('readonly')) {
                return
            }
            label = input.val()
            var newfieldname = labeltoname(label)
            if (newfieldname && newfieldname != fn) {
                $('[data-fieldname="'+fn+'"]').attr('data-fieldname',newfieldname)
                fn = newfieldname
            }
        } else {
            label = entry.text()
        }
        label = '<'+label+'>'
        if (selecting.hasClass('roster-new-field')) {
            var cls = ''
            if (entry.hasClass('search-field-external')) {
                cls += ' field-external'
            } else {
                if ($('#roster-list .roster-entry:not(.editing) div[data-fieldname="'+fn+'"]').length == 0) {
                    cls += ' field-normal'
                    if (re.find('.roster-field.field-normal.field-mandatory').length == 0) {
                        cls += ' field-mandatory'
                    }
                }
            }
            selecting.before('<div class="roster-field-'+fn+cls+' roster-field" data-fieldname="'+fn+'" data-fieldtype="">'+
                '<div class="roster-field-radiobutton"></div><span>'+htmlize(label)+'</span></div>')
        } else {
            selecting.find('span').text(label)
            selecting.attr('data-fieldname', fn)
            if (entry.hasClass('search-field-external')) {
                selecting.addClass('field-external').removeClass('field-normal')
            } else {
                selecting.removeClass('field-external')
                if ($('#roster-list .roster-entry:not(.editing) div[data-fieldname="'+fn+'"]').length == 0) {
                    selecting.addClass('field-normal')
                    if (re.find('.roster-field.field-normal.field-mandatory').length == 0) {
                        selecting.addClass('field-mandatory')
                    }
                }
            }
        }
    }
    hide_popups()
}

function labeltoname(label)
{
    return 'roster:'+label.replace(/[^A-Za-z0-9]+/g, '_').toLowerCase()
}

function add_new_search_field()
{
    var tdiv = $(this).closest('.search-field-new')
    var input = tdiv.find('input[type="text"]')
    var fieldlabel = input.val()
    if (!fieldlabel) { return }
    var fieldname = labeltoname(fieldlabel)
    var newentry = $('#add-field-popup .search-field[data-fieldname="'+fieldname+'"]')
    if (newentry.length == 0) {
        newentry = $('<div class="search-field search-field-new" data-fieldname="'+fieldname+'">'+
            '<input type="text" placeholder="Description" value="'+fieldlabel+'">'+
            '<div class="search-field-edit">&#61504;</div>').insertBefore(tdiv)
    }
    newentry.click()
    input.val('')
}

function edit_search_field(e)
{
    $(this).closest('.search-field').find('input').attr('readonly',false).focus().select()
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
    document.cookie = cookie+'='+encodeURIComponent(value)+';SameSite=None;Secure;expires='+expir.toUTCString()
}

api_load(load)
