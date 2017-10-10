var $applozic = jQuery.noConflict(true);
if (typeof $original !== 'undefined') {
    $ = $original;
    jQuery = $original;
    if (typeof $.fn.template === 'function') {
        $applozic.fn.template = $.fn.template;
        jQuery.fn.template = $.fn.template;
    } else if (typeof $applozic.fn.template === 'function') {
        $.fn.template = $applozic.fn.template;
        jQuery.fn.template = $applozic.fn.template;
    }
}
var w = window,
    d = document;
var MCK_LABELS;
var MCK_BASE_URL;
var MCK_CURR_LATITIUDE = 40.7324319;
var MCK_CURR_LONGITUDE = -73.82480777777776;
var mckUtils = new MckUtils();
mckUtils.init();
var mckDateUtils = new MckDateUtils();
var mckGroupUtils = new MckGroupUtils();
var mckContactUtils = new MckContactUtils();
var mckGroupService = new MckGroupService();
var mckMapUtils = new MckMapUtils();
var mckNotificationUtils = new MckNotificationUtils();
function MckContactUtils() {
    var _this = this;
    _this.getContactId = function(contact) {
        var contactId = contact.contactId;
        return _this.formatContactId(contactId);
    };
    _this.formatContactId = function(contactId) {
        if (contactId.indexOf('+') === 0) {
            contactId = contactId.substring(1);
        }
        contactId = decodeURIComponent(contactId);
        return $applozic.trim(contactId.replace(/\@/g, 'AT').replace(/\./g, 'DOT').replace(/\*/g, 'STAR').replace(/\#/g, 'HASH').replace(/\|/g, 'VBAR').replace(/\+/g, 'PLUS').replace(/\;/g, 'SCOLON').replace(/\?/g, 'QMARK').replace(/\,/g, 'COMMA').replace(/\:/g, 'COLON'));
    };
}
function MckGroupUtils() {
    var _this = this
    _this.getGroup = function(groupId) {
        if (typeof MCK_GROUP_MAP[groupId] === 'object') {
            return MCK_GROUP_MAP[groupId];
        } else {
            return;
        }
    };
    _this.getGroupByClientGroupId = function(clientGroupId) {
        if (typeof MCK_CLIENT_GROUP_MAP[clientGroupId] === 'object') {
            return MCK_CLIENT_GROUP_MAP[clientGroupId];
        } else {
            return;
        }
    };
    _this.addGroup = function(group) {
        var name = (group.name) ? group.name : group.id;
        var users = [];
        $applozic.each(group.groupUsers, function(i, user) {
            if (user.userId) {
                users[user.userId] = user;
            }
        });
        var removedMembersId = (typeof group.removedMembersId !== 'undefined') ? group.removedMembersId : [];
        var groupFeed = {
            'contactId': group.id.toString(),
            'htmlId': mckContactUtils.formatContactId('' + group.id),
            'displayName': name,
            'value': group.id.toString(),
            'adminName': group.adminName,
            'type': group.type,
            'members': group.membersName,
            'imageUrl': group.imageUrl,
            'users': users,
            'userCount': group.userCount,
            'removedMembersId': removedMembersId,
            'clientGroupId': group.clientGroupId,
            'isGroup': true,
            'deletedAtTime' :group.deletedAtTime
        };
        MCK_GROUP_MAP[group.id] = groupFeed;
        if (group.clientGroupId) {
            MCK_CLIENT_GROUP_MAP[group.clientGroupId] = groupFeed;
        }
        return groupFeed;
    };
    _this.createGroup = function(groupId) {
        var group = {
            'contactId': groupId.toString(),
            'htmlId': mckContactUtils.formatContactId('' + groupId),
            'displayName': groupId.toString(),
            'value': groupId.toString(),
            'type': 2,
            'adminName': '',
            'imageUrl': '',
            'userCount': '',
            'users': [],
            'removedMembersId': [],
            'clientGroupId': '',
            'isGroup': true,
            'deletedAtTime':''
            
        };
        MCK_GROUP_MAP[groupId] = group;
        return group;
    };
}


function MckGroupService() {
    var _this = this;
    var GROUP_LIST_URL = "/rest/ws/group/list";
    var GROUP_FEED_URL = "/rest/ws/group/info";
    var GROUP_LEAVE_URL = "/rest/ws/group/left";
    var GROUP_UPDATE_INFO_URL = "/rest/ws/group/update";
    var GROUP_ADD_MEMBER_URL = "/rest/ws/group/add/member";
    var GROUP_REMOVE_MEMBER_URL = "/rest/ws/group/remove/member";
    _this.loadGroups = function(params) {
        var response = new Object();
        mckUtils.ajax({
            url: MCK_BASE_URL + GROUP_LIST_URL,
            type: 'get',
            global: false,
            success: function(data) {
                if (data.status === 'success') {
                    response.status = 'success';
                    response.data = data.response;
                    if (params.apzCallback) {
                        params.apzCallback(response);
                    }
                } else {
                    response.status = 'error';
                }
                if (params.callback) {
                    params.callback(response);
                }
            },
            error: function(xhr, desc, err) {
                 if (xhr.status === 401) {
                    sessionStorage.clear();
                }
                console.log('Unable to load groups. Please reload page.');
                response.status = 'error';
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response);
                }
            }
        });
    };
    _this.getGroupFeed = function(params) {
        var data = "";
        if (typeof params.callback === 'function' || typeof params.apzCallback === 'function') {
            var response = new Object();
        } else {
            return;
        }
        if (params.groupId) {
            data += "groupId=" + params.groupId;
        } else if (params.clientGroupId) {
            data += "clientGroupId=" + params.clientGroupId;
        } else {
            if (typeof params.callback === 'function') {
                response.status = "error";
                response.errorMessage = "GroupId or Client GroupId Required";
                params.callback(response);
            }
            return;
        }
        if (params.conversationId) {
            data += "&conversationId=" + params.conversationId;
        }
        mckUtils.ajax({
            url: MCK_BASE_URL + GROUP_FEED_URL,
            data: data,
            type: 'get',
            global: false,
            success: function(data) {
                if (data.status === "success") {
                    var groupFeed = data.response;
                    if (groupFeed + '' === "null" || typeof groupFeed !== "object") {
                        response.status = "error";
                        response.errorMessage = "GroupId not found";
                    } else {
                        var group = mckGroupUtils.addGroup(groupFeed);
                        response.status = "success";
                        response.data = group;
                    }
                } else if (data.status === "error") {
                    response.status = "error";
                    response.errorMessage = data.errorResponse[0].description;
                }
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    if (response.status === "success") {
                        response.data = groupFeed;
                    }
                    params.apzCallback(response, params);
                }
            },
            error: function() {
                console.log('Unable to load group. Please reload page.');
                response.status = "error";
                response.errorMessage = 'Please reload page.';
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response, params);
                }
            }
        });
    };
    _this.leaveGroup = function(params) {
        var data = "";
        var response = new Object();
        if (params.groupId) {
            data += "groupId=" + params.groupId;
        } else if (params.clientGroupId) {
            data += "clientGroupId=" + params.clientGroupId;
        } else {
            response.status = "error";
            response.errorMessage = "GroupId or Client GroupId Required";
            if (params.callback) {
                params.callback(response);
            }
            return;
        }
        mckUtils.ajax({
            url: MCK_BASE_URL + GROUP_LEAVE_URL,
            data: data,
            type: 'get',
            global: false,
            success: function(data) {
                if (data.status === "success") {
                    if (params.clientGroupId) {
                        var group = mckGroupUtils.getGroupByClientGroupId(params.clientGroupId);
                        if (typeof group === 'object') {
                            params.groupId = group.contactId;
                        }
                    }
                    response.status = "success";
                    response.data = {
                        groupId: params.groupId
                    };
                } else {
                    response.status = "error";
                    response.errorMessage = data.errorResponse[0].description;
                }
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response, {
                        groupId: params.groupId
                    });
                }
            },
            error: function() {
                console.log('Unable to process your request. Please reload page.');
                response.status = "error";
                response.errorMessage = "";
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response);
                }
            }
        });
    };
    _this.removeGroupMember = function(params) {
        var data = '';
        var response = new Object();
        if (params.groupId) {
            data += 'groupId=' + params.groupId;
        } else if (params.clientGroupId) {
            data += 'clientGroupId=' + params.clientGroupId;
        } else {
            response.status = 'error';
            response.errorMessage = "GroupId or Client GroupId Required";
            if (typeof params.callback === 'function') {
                params.callback(response);
            }
            return;
        }
        data += '&userId=' + encodeURIComponent(params.userId);
        mckUtils.ajax({
            url: MCK_BASE_URL + GROUP_REMOVE_MEMBER_URL,
            data: data,
            type: 'get',
            global: false,
            success: function(data) {
                if (data.status === 'success') {
                    if (params.clientGroupId) {
                        var group = mckGroupUtils.getGroupByClientGroupId(params.clientGroupId);
                        if (typeof group === 'object') {
                            params.groupId = group.contactId;
                        }
                    }
                    response.status = "success";
                    response.data = data.response;
                } else {
                    response.status = "error";
                    response.errorMessage = data.errorResponse[0].description;
                }
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response, params)
                }
            },
            error: function() {
                console.log('Unable to process your request. Please reload page.');
                response.status = 'error';
                response.errorMessage = '';
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response);
                }
            }
        });
    };
    _this.addGroupMember = function(params) {
        var data = '';
        var response = new Object();
        if (params.groupId) {
            data += 'groupId=' + params.groupId;
        } else if (params.clientGroupId) {
            data += 'clientGroupId=' + params.clientGroupId;
        } else {
            if (typeof params.callback === 'function') {
                params.callback(response);
            }
            return;
        }
        data += '&userId=' + encodeURIComponent(params.userId);
        if (typeof params.role !== 'undefined') {
            data += '&role=' + params.role;
        }
        mckUtils.ajax({
            url: MCK_BASE_URL + GROUP_ADD_MEMBER_URL,
            data: data,
            type: 'get',
            global: false,
            success: function(data) {
                if (data.status === "success") {
                    if (params.clientGroupId) {
                        var group = mckGroupUtils.getGroupByClientGroupId(params.clientGroupId);
                        if (typeof group === 'object') {
                            params.groupId = group.contactId;
                        }
                    }
                    response.status = 'success';
                    response.data = data.response;
                } else {
                    response.status = 'error';
                    response.errorMessage = data.errorResponse[0].description;
                }
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response, params)
                }
            },
            error: function() {
                console.log('Unable to process your request. Please reload page.');
                response.status = "error";
                response.errorMessage = '';
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response);
                }
            }
        });
    };
    _this.updateGroupInfo = function(params) {
        var groupInfo = {};
        var response = new Object();
        if (params.groupId) {
            groupInfo.groupId = params.groupId;
        } else if (params.clientGroupId) {
            groupInfo.clientGroupId = params.clientGroupId;
        } else {
            if (typeof params.callback === 'function') {
                response.status = 'error';
                response.errorMessage = 'GroupId or Client GroupId Required';
                params.callback(response);
            }
            return;
        }
        if (params.name) {
            groupInfo.newName = params.name;
        }
        if (params.imageUrl) {
            groupInfo.imageUrl = params.imageUrl;
        }
        if (params.users && params.users.length > 0) {
            groupInfo.users = params.users;
        }
        mckUtils.ajax({
            url: MCK_BASE_URL + GROUP_UPDATE_INFO_URL,
            type: 'post',
            data: JSON.stringify(groupInfo),
            contentType: 'application/json',
            global: false,
            success: function(data) {
                if (data.status === "success") {
                    if (params.clientGroupId) {
                        var group = mckGroupLayout.getGroupByClientGroupId(params.clientGroupId);
                        if (typeof group === 'object') {
                            params.groupId = group.contactId;
                        }
                    }
                    response.status = "success";
                    response.data = data.response;
                } else {
                    response.status = "error";
                    response.errorMessage = data.errorResponse[0].description;
                }
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response, {
                        groupId: params.groupId,
                        groupInfo: groupInfo
                    })
                }
            },
            error: function() {
                console.log('Unable to process your request. Please reload page.');
                response.status = "error";
                response.errorMessage = "Unable to process your request. Please reload page.";
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response);
                }
            }
        });
    };
}