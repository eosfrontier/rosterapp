var orthancurl = 'https://api.eosfrontier.space/orthanc'
if (window.location.toString().match(/eosfrontier\.space/)) {
    $.get('assets/id.php', load, 'json')
    // Iffy because function load() this is in admin.js and roster.js
    // Can probably do better
} else {
    // For running/debugging locally.
    orthancurl = 'https://apidev2.eosfrontier.space/orthanc'
    $(function() {
        var s = document.createElement('script')
        s.type = 'text/javascript'
        s.src = 'token.js'
        document.head.append(s)
    })
    // Migrating app data
    if (window.location.hash == "#migratev2") {
        $(function() {
            var s = document.createElement('script')
            s.type = 'text/javascript'
            s.src = 'migrate.js'
            document.head.append(s)
        })
        console.log('trying migrate')
    }
}

var loading = {}

var orthancv2 = function() {
    console.log('Not logged in')
}

function get_types(callback, context)
{
    loading["types"] = true
    orthancv2('GET', 'app/options', callback, { 'option_name': 'roster:%', 'wildcard': true })
}

function get_characters(callback)
{
    loading["chars"] = true
    orthancv2('GET', 'chars_all', callback, { 'all_characters': true})
}

function get_roster(rosterid, callback)
{
    loading["roster"] = true
    orthancv2('GET', 'app/options', callback, { 'option_name': 'field:'+rosterid+':%', 'wildcard': true })
}

function get_all_roster_meta(meta_fields, callback, context)
{
    loading["meta"] = true
    orthancv2('GET', 'meta', callback, { 'meta_name': meta_fields.join(',') }, context)
}

function get_roster_meta(rosterid, callback)
{
    orthancv2('GET', 'app/options', callback, { 'option_name': 'field:'+rosterid+':%', 'wildcard': true })
}

function delete_roster_meta(rosterid, meta, callback, context)
{
    orthancv2('DELETE', 'meta', callback, { 'id': rosterid, 'meta': meta }, context)
}

function save_roster_meta(rosterid, fields, callback)
{
    // We have to split into patch and post here because the api doesn't follow the standard http protocol definition
    var patchfields = []
    var postfields = []
    var calls = 0

    for (var f = 0; f < fields.length; f++) {
        if (fields[f].old_value != null) {
            if (fields[f].old_value != fields[f].value) {
                patchfields.push(fields[f])
            }
        } else {
            postfields.push(fields[f])
        }
    }
    // Only callback once.  We don't return result because it's ignored anyway
    var cb_func = function(result) {
        calls--
        if (calls == 0) {
            callback()
        }
    }
    if (patchfields.length > 0) {
        calls++
        orthancv2('PATCH', 'app/options', cb_func, { 'id': gAppId, 'option': JSON.stringify(patchfields) })
        // orthancv2('PATCH', 'meta', cb_func, { 'id': rosterid, 'meta': JSON.stringify(patchfields) })
    }
    if (postfields.length > 0) {
        calls++
        orthancv2('POST', 'app/options', cb_func, { 'id': gAppId, 'option': JSON.stringify(postfields) })
        // orthancv2('POST', 'meta', cb_func, { 'id': rosterid, 'meta': JSON.stringify(postfields) })
    }
}

function get_character_meta(charid, meta_fields, callback)
{
    orthancv2('GET', 'meta', callback, { 'id': charid, 'meta_name': meta_fields.join(',') })
}

function save_character_meta(charid, fieldname, old_value, newvalue, callback)
{
    if (old_value != null) {
        orthancv2('PATCH', 'meta', callback, { 'id': charid, 'meta': JSON.stringify([{ 'name': fieldname, 'old_value': old_value, 'value': newvalue }]) })
    } else {
        orthancv2('POST', 'meta', callback, { 'id': charid, 'meta': JSON.stringify([{ 'name': fieldname, 'value': newvalue }]) })
    }
}

function delete_character_meta(charid, fieldname, old_value, callback)
{
    orthancv2('DELETE', 'meta', callback, { 'id': charid, 'meta': [{ 'name': fieldname, 'value': old_value, 'deleted': true }] })
}

function get_accountid(accountid, callback)
{
    if (accountid) {
        orthancv2('GET', 'chars_all', callback, { 'accountID': accountid })
    }
}

function initialize_api(idandtoken)
{
    var clienttoken = idandtoken.token
    if (!clienttoken) { return }
    $('#nologin').remove()
    orthancv2 = function (verb, endpoint, callback, data, context)
    {
        if (!data) data = {}
        params = {
            'type': verb,
            'url': orthancurl+'/v2/'+endpoint+'/',
            'dataType': 'json',
            'context': context ? context : data,
            'success': callback
        }
        if (verb == 'GET') {
            data['token'] = clienttoken
            params['headers'] = data
        } else {
            params['contentType'] = 'application/json'
            params['data'] = JSON.stringify(data)
            params['headers'] = {token: clienttoken}
        }
        $.ajax(params)
    }
}
