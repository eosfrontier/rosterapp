$.get('assets/id.php', load, 'json')

var orthanc = 'https://api.eosfrontier.space/orthanc'
//var orthanc = '/orthanc'
var mugserver = 'https://www.eosfrontier.space/eos_douane/images/mugs/'

var gRosters
var gPeople = {}
var gCharacters
var gAccountID = 0
var gIsOwner = false
var loading = {}
var roster_type
var roster_label = 'roster'
var gRosterID = 0
var person_fields
var primary_fields
var multi_fields = {}
var func_fields = {}
var sort_field
var special_fields = { character_image:'<div><img src="'+mugserver+'{{characterID}}.jpg"></div>' }
var special_fieldsnew = { character_image:'<div><div class="image-add-new">+</div></div>' }
var editable_fields
var meta_fields = []
var character_fields = []
var search_value = ''
var clienttoken

$.postjson = function(url, data, callback) {
    data['token'] = clienttoken
    $.ajax({
        'type': 'POST',
        'url': url,
        'contentType': 'text/plain',
        'context': data,
        'data': JSON.stringify(data),
        'dataType': 'json',
        'success': callback,
    })
}

function load(idandtoken)
{
    clienttoken = idandtoken.token
    if (!clienttoken) { return }
    $('#nologin').remove()
    gAccountID = parseInt(idandtoken.id)
    gRosterID = get_cookie('roster_id')
    loading["types"] = true
    $.postjson(orthanc+'/character/meta/', {'meta':'roster:type'}, fill_roster_types)
    loading["chars"] = true
    $.postjson(orthanc+'/character/', { "all_characters":"all_characters" }, fill_roster_chars)
    $('#roster-list').on('click','.roster-entry.add-new',search_new_person)
    $('#search-person-list').on('click','.search-person', add_new_person)
    $(document).click(hide_popups)
    $('#add-person-popup').click(function(e) { e.stopPropagation() })
    $('#search-input').on('input',input_searchlist)
    $('#search-input').on('keypress',keypress_searchlist)
    $('#roster-list').on('click','.roster-button-edit', edit_person)
    $('#roster-list').on('input','.editable > input', change_person_field)
    $('#roster-list').on('change','.editable.changed > input[type="text"]', save_person_field)
    $('#roster-list').on('change','.editable > input[type="checkbox"]', save_person_checkbox)
    $('#roster-list').on('click','.roster-button-delete', delete_person)
    $('#roster-list').on('click',':not(.editing) .field-conflict-choice', edit_person)
    $('#roster-list').on('click','.field-conflict-save', save_conflict)

    $('.menu-button').click(show_menu)
    $('#headermenu-list').on('click', '.header-menu-roster_type', set_roster_type)
    $(window).on('hashchange', function() { if (window.location.hash != '#select') { $('.add-popup').removeClass('visible') } })
}

function fill_roster_types(rosters)
{
    var html = []
    for (var i = 0; i < rosters.length; i++) {
        var rtv = rosters[i].value.split(':')
        var rt = rtv[0]
        var rl = 'roster'
        if (rtv[2] != '') { rl = rtv[2] }
        html.push('<div class="header-menu-roster_type menu-item" data-roster-type="',rt,
            '" data-roster-label="',rl,'" data-roster-id="',
            rosters[i].character_id,'">',rt,' ',rl,'</div>')

    }
    loading["types"] = false
    $('#headermenu-list').html(html.join(''))
    if (gRosterID != 0) {
        loading["roster"] = true
        $.postjson(orthanc+'/character/meta/', {'id':gRosterID}, fill_roster_fields)
    } else {
        $('.menu-button').addClass('visible') 
    }
}

function fill_roster_fields(roster)
{
    person_fields = []
    primary_fields = {}
    multi_fields = {}
    func_fields = {}
    sort_field = 'character_name'
    sort_reverse = false
    editable_fields = {}
    meta_fields = []
    character_fields = []
    for (var i = 0; i < roster.length; i++) {
        var metaname = roster[i].name
        var metaval = roster[i].value.split(':')
        if (metaname != 'roster:type') {
            var metaset = metaname.split(':')
            var external = false
            if (metaset.length > 2) {
                if (metaset[1] == 'character') {
                    external = true
                    metaname = metaset.slice(2).join(':')
                    character_fields.push(metaname)
                } else {
                    external = true
                    metaname = metaset.slice(1).join(':')
                    meta_fields.push(metaname)
                }
            } else {
                meta_fields.push(metaname)
            }
            if (parseInt(metaval[0]) != 0) {
                person_fields.push({ roster_order: parseInt(metaval[0]), fieldname: metaname})
            }
            var fieldtypes = metaval[1].split(',')
            for (var ft = 0; ft < fieldtypes; ft++) {
                switch(fieldtypes[ft][0]) {
                    case 'P':
                        primary_fields[metaname] = true
                        break;
                    case 'S':
                        sort_field = metaname
                        if (fieldtypes[ft][1] == 'D') sort_reverse = true
                        break;
                    case 'T':
                        func_fields[metaname] = render_time
                        break;
                    case 'M':
                        var mmax = parseInt(metaval[1].slice(midx+1))
                        if (!mmax) mmax = 0
                        multi_fields[metaname] = mmax
                        break;
                }
            }
            if (!external) {
                editable_fields[metaname] = metaval[2]
            }
        } else {
            meta_fields.push('roster:admin:'+this.id)
            roster_type = metaval[0]
            roster_label = 'roster'
            if (metaval[2] != '') { roster_label = metaval[2] }
            $('span.roster-type').text(roster_type)
            $('span.roster-label').text(roster_label)
        }
    }
    person_fields.sort(function(a,b) { return a.roster_order - b.roster_order })
    for (var f = 0; f < person_fields.length; f++) {
        person_fields[f] = person_fields[f].fieldname
    }
    person_fields.unshift('character_name')
    person_fields.unshift('character_image')
    loading["roster"] = false
    loading["meta"] = true
    $.postjson(orthanc+'/character/meta/', { "meta":meta_fields.join(',') }, fill_roster_meta)
}

function fill_roster_chars(people)
{
    people = people.filter(function(p) { return p.character_name })
    people.sort(function(a,b) { return (a.character_name < b.character_name) ? -1 : 1 })
    gCharacters = people
    loading["chars"] = false
    fill_roster()
    fill_searchlist()
}

function fill_roster_meta(fields)
{
    for (var p = 0; p < fields.length; p++) {
        fields[p].id = parseInt(fields[p].id)
        if ((fields[p].character_id < 0) && (fields[p].character_id != gRosterID)) {
            var fv = fields[p].value.split(':')
            if (fv[1] != '') {
                delete editable_fields[fields[p].name]
            }
        }
    }
    // Reverse order: newest first
    fields.sort(function(a,b) { return b.id - a.id })
    // gPeople = {}
    for (var pid in gPeople) {
        for (var f = 0; f < meta_fields.length; f++) {
            delete gPeople[pid][meta_fields[f]]
        }
    }
    for (var p = 0; p < fields.length; p++) {
        var pid = fields[p].character_id
        if (pid >= 0) {
            if (!gPeople[pid]) {
                gPeople[pid] = { characterID: pid }
            }
            if (gPeople[pid][fields[p].name]) {
                if (!Array.isArray(gPeople[pid][fields[p].name])) {
                    gPeople[pid][fields[p].name] = [gPeople[pid][fields[p].name]]
                }
                gPeople[pid][fields[p].name].push(fields[p].value)
            } else {
                gPeople[pid][fields[p].name] = fields[p].value
            }
        }
    }
    loading["meta"] = false
    fill_roster()
}

function fill_roster()
{
    for (var l in loading) {
        if (loading[l]) return
    }
    var canedit = false
    gIsOwner = false
    if (gCharacters) {
        for (var pid in gPeople) {
            for (var f = 0; f < character_fields.length; f++) {
                delete gPeople[pid][character_fields[f]]
            }
        }
        for (var p = 0; p < gCharacters.length; p++) {
            var person = gCharacters[p]
            var pid = person.characterID
            var ppl = gPeople[pid]
            if (ppl) {
                for (var f = 0; f < person_fields.length; f++) {
                    var fn = person_fields[f]
                    if (person[fn]) { ppl[fn] = person[fn] }
                }
                if (person.accountID == gAccountID) {
                    var isadmin = ppl['roster:admin:'+gRosterID]
                    if (isadmin) {
                        canedit = true
                        if (isadmin == 'owner') {
                            gIsOwner = true
                        }
                    }
                }
            }
            // $('#roster-list > .roster-entry[data-character-id="'+pid+'"]').replaceWith(roster_entry(ppl))
        }
    }
    var html = []
    var plist = []
    for (var pid in gPeople) {
        var key = gPeople[pid][sort_field]
        if (key) {
            if (Array.isArray(key)) { key = key[0] }
            plist.push({ id: pid, key: key })
        }
    }
    plist.sort(function(a,b) { return a.key.localeCompare(b.key) })
    if (sort_reverse) { plist.reverse() }

    for (var p = 0; p < plist.length; p++) {
        pid = plist[p].id
        if (!gPeople[pid].hasOwnProperty('character_name')) {
            delete gPeople[pid]
        } else {
            var ren = roster_entry(gPeople[pid], false, canedit)
            if (ren) {
                html.push(ren)
            }
        }
    }
    if (canedit) {
        html.push(roster_entry_new())
    }
    $('#roster-list').html(html.join(''))
}

/*
function fill_one_char(person)
{
    var pid = person.characterID
    var ppl = gPeople[pid]
    for (var f = 0; f < person_fields.length; f++) {
        var fn = person_fields[f]
        if (person[fn]) { ppl[fn] = person[fn] }
    }
    $('#roster-list > .roster-entry[data-character-id="'+pid+'"]').replaceWith(roster_entry(ppl))
}
*/

function set_roster_type()
{
    roster_type = $(this).attr('data-roster-type')
    roster_label = $(this).attr('data-roster-label')
    gRosterID = $(this).attr('data-roster-id')
    $('span.roster-type').text(roster_type)
    $('span.roster-label').text(roster_label)
    set_cookie('roster_id', gRosterID)
    $('#roster-list').html('<h3 class="loading">'+htmlize('Loading '+roster_type+' '+roster_label)+'</h3>')
    loading["chars"] = true
    loading["roster"] = true
    $.postjson(orthanc+'/character/meta/', {'id':gRosterID}, fill_roster_fields)
    $.postjson(orthanc+'/character/', { "all_characters":"all_characters" }, fill_roster_chars)
    setTimeout(hide_popups, 0)
}

function show_menu(e)
{
    $(this).toggleClass('visible')
    e.stopPropagation()
}

function htmlize(text)
{
    if (text == null) { return '' }
    return String(text).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')
}

function format_timediff(now, time)
{
    var diff = Math.floor((now - time) / 1000)
    var fields = []
    var sizes = [
        60,'s',
        60,'m',
        24,'h',
        7,'d',
        10000000,'w'
    ]
    for (var i = 0; i < sizes.length; i += 2) {
        var val = diff % sizes[i]
        if (val < 10) val = '0'+val
        fields.unshift(val + sizes[i+1])
        diff = Math.floor(diff / sizes[i])
        if (diff <= 0) break;
    }
    return fields.slice(0,2).join(' ')
}

function render_time(text)
{
    var fields = text.split(':')
    if (!fields[0].match(/^[0-9]+$/)) {
        return htmlize(text)
    }
    // TODO: IC time conversion
    var timetxt = format_timediff(new Date(), new Date(parseInt(fields[0]+'000')))
    var cls = 'access-'+htmlize(fields[1].toLowerCase())
    return '<span class="'+cls+'">'+timetxt+' ago : '+fields[1]+'</span>'
}

function roster_entry(entry, doedit, canedit)
{
    if (!doedit) {
        for (var f in primary_fields) {
            if (entry[f] == null) {
                return
            }
        }
    }
    var html = ['<div class="roster-entry']
    if (doedit) { html.push(' editing') }
    if (entry['faction']) { html.push(' faction-',htmlize(entry['faction'])) }
    html.push('" data-character-id="',entry.characterID,'">')
    for (var f = 0; f < person_fields.length; f++) {
        pf = person_fields[f]
        var text = entry[pf] || ''
        var ecls = ''
        var etitle = ''
        var renderfunc = htmlize
        if (func_fields[pf] != null) {
            renderfunc = func_fields[pf]
        }
        if (Array.isArray(text)) {
            if (multi_fields[pf] != null) {
                if (pf == sort_field) {
                    text.sort(function(a,b) { return a.localeCompare(b) })
                    if (sort_reverse) { text.reverse() }
                }
                if (multi_fields[pf] > 0) { text = text.slice(0,multi_fields[pf]) }
                text = text.map(renderfunc).join('</div><div class="roster-person-'+pf+'">')
            } else if (canedit) {
                text = '<div class="field-conflict-choice selected">'+text.map(renderfunc).join('</div><div class="field-conflict-choice">')+'</div>'
                ecls += ' field-conflict'
                etitle = 'Conflicting edits, please resolve!'
            } else {
                text = renderfunc(text[0])
            }
        } else {
            text = renderfunc(text)
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
                if (primary_fields[pf]) {
                    ecls += ' initial'
                }
            }
        }
        html.push('<div data-field-name="',pf,'" class="roster-person-',pf,ecls,'" title="',etitle,'">',text,'</div>')
        if (f == 0) {
            if (canedit) {
                html.push('<div class="roster-buttons"><div class="roster-button-edit button" title="Edit"></div>',
                    '<div class="roster-button-delete button" title="Delete"></div></div>')
            } else {
                html.push('<div class="dummy"></div>')
            }
        }
    }
    if (doedit && gIsOwner) {
        var iseditor = ''
        if (gPeople[entry.characterID]) {
            iseditor = gPeople[entry.characterID]['roster:admin:'+gRosterID]
        }
        if (iseditor == 'owner') {
            html.push('<div data-field-name="roster:admin:',gRosterID,'" class="roster-owner" title="Owns this roster">Owner</div>')
        } else {
            html.push('<div data-field-name="roster:admin:',gRosterID,'" class="roster-editor editable" title="Can edit this roster">')
            html.push('<input type="checkbox" value="editor" '+(iseditor ? ' checked' : '')+'>Editor</div>')
        }
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

function fill_searchlist()
{
    var html = []
    for (var p = 0; p < gCharacters.length; p++) {
        var entry = gCharacters[p]
        if ((entry['accountID'] > 0) && (entry['sheet_status'] == 'active')) {
            html.push('<div class="selected search-person')
            if (entry['faction']) { html.push(' faction-',htmlize(entry['faction'])) }
            html.push('" data-character-index="',p,
                '" data-character-id="',htmlize(entry['characterID']),'" data-search-key="',
                htmlize(entry['character_name'].toLowerCase()),'">',
                '<div class="search-person-character_image"></div>',
                '<div class="search-person-character_name">',htmlize(entry['character_name']),'</div>',
                '<div class="search-person-faction">',htmlize(entry['faction']),'</div>',
                '<div class="search-person-rank">',htmlize(entry['rank']),'</div>',
                '</div>')
        }
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
        if (!$('#add-person-popup').hasClass('visible')) { window.location.hash = '#select' }
        $('#add-person-popup').addClass('visible')
        $('#search-input').focus()
        }, 0)
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

function add_new_person()
{
    hide_popups()
    var item = $(this)
    var idx = $(this).attr('data-character-index')
    if (idx) {
        var person = gCharacters[idx]
        var id = person.characterID
        if (!gPeople[id]) {
            var ppl = { characterID: id }
            for (var f = 0; f < person_fields.length; f++) {
                var fn = person_fields[f]
                if (person[fn]) { ppl[fn] = person[fn] }
            }
            gPeople[id] = ppl
        }
        var newentry = $(roster_entry(gPeople[id], true)).insertBefore('#roster-list .roster-entry.add-new')
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
    if (gIsOwner) {
        var iseditor = ''
        if (gPeople[characterID]) {
            iseditor = gPeople[characterID]['roster:admin:'+gRosterID]
        }
        if (iseditor == 'owner') {
            rp.append($('<div data-field-name="roster:admin:'+gRosterID+'" class="roster-owner" title="Owns this roster">Owner</div>'))
        } else {
            rp.append($('<div data-field-name="roster:admin:'+gRosterID+'" class="roster-editor editable" title="Can edit this roster"><input type="checkbox" value="editor" '+(iseditor ? ' checked' : '')+'>Editor</div>'))
        }
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
                    $(this).find('.search-person-character_image').html('<img src="'+mugserver+characterID+'.jpg">')
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

function save_person_checkbox()
{
    var newvalue = $(this).val()
    var field = $(this).closest('.editable')
    var fieldname = field.attr('data-field-name')
    var characterID = field.closest('.roster-entry').attr('data-character-id')
    if (characterID && fieldname) {
        if ($(this).is(':checked')) {
            $.postjson(orthanc+'/character/meta/update.php', {
                id: characterID, meta: [{ name: fieldname, value: newvalue, oldvalue: newvalue }] }, saved_person_field)
        } else {
            $.postjson(orthanc+'/character/meta/delete.php', {
                id: characterID, meta: [{ name: fieldname, value: newvalue }] }, saved_person_field)
        }
    }
}

function save_person_field()
{
    if ($(this).is('[type="checkbox"]')) {
        return save_person_checkbox()
    }
    var newvalue = $(this).val()
    var oldvalue = $(this).attr('value')
    if (oldvalue == null) { oldvalue = null }
    if (newvalue == null) { newvalue = null }
    var field = $(this).closest('.editable')
    if (oldvalue != newvalue || field.hasClass('initial')) {
        var fieldname = field.attr('data-field-name')
        var characterID = field.closest('.roster-entry').attr('data-character-id')
        if (characterID && fieldname) {
            $.postjson(orthanc+'/character/meta/update.php', {
                id: characterID, meta: [{ name: fieldname, value: newvalue, oldvalue: oldvalue }] }, saved_person_field)
        }
    }
}

function saved_person_field(result)
{
    if (result == "success") {
        var entry = $("#roster-list .roster-entry[data-character-id='"+this.id+"']")
        for (var i = 0; i < this.meta.length; i++) {
            var field = entry.find(".editable[data-field-name='"+this.meta[i].name+"']")
            if (this.meta[i].value == null) {
                entry.addClass('deleted')
                field.text('')
            } else {
                if (field.hasClass('field-conflict')) {
                    field.find(".field-conflict-choose:has(input[data-fieldvalue='"+this.meta[i].value+"'])").remove()
                    if (field.find('.field-conflict-choose').length <= 1) {
                        field.removeClass('field-conflict').addClass('field-conflict-resolved').attr('title','')
                    }
                    if (entry.find('.field-conflict').length < 1) {
                        entry.removeClass('editing')
                    }
                } else {
                    var input = field.find("input")
                    var fv = this.meta[i].value
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
}

function delete_person()
{
    var rp = $(this).closest('.roster-entry')
    if (rp.length == 1) {
        var characterID = rp.attr('data-character-id')
        if (characterID) {
            var name = rp.find("[data-field-name='character_name']").text()
            if (!name) { name = rp.find("[data-field-name='character_name'] input").val() }
            if (confirm("Remove "+name+" from "+roster_type+" "+roster_label+"?")) {
                rp.find('.editable[data-field-name]').each(function() {
                    var fieldname = $(this).attr('data-field-name')
                    if (primary_fields[fieldname]) {
                        var oldvalue = ''
                        var input = $(this).find('input')
                        if (input.length == 1) {
                            oldvalue = input.attr('value')
                        } else {
                            oldvalue = $(this).text()
                        }
                        $.postjson(orthanc+'/character/meta/delete.php', {
                            id: characterID, meta: [{ name: fieldname }] }, saved_person_field)
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
        $.postjson(orthanc+'/character/meta/delete.php', {
            id: characterID, meta: [{ name: fieldname, value: oldvalue }] }, saved_person_field)
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

