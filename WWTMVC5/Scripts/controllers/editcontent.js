﻿wwtng.controller('EditContent', [
    '$scope',
    'dataproxy',
    '$timeout',
    '$routeParams',
    'UIHelper',
    'FileUploader',
    '$http',
    function ($scope, dataproxy, $timeout, $routeParams, uiHelper, fileUploader, $http) {
        $scope.isEdit = $routeParams && $routeParams.contentId && parseInt($routeParams.contentId) > 0;
        $scope.contentuploader = new fileUploader({
            url: "/Content/AddContent/1",
            autoUpload: true,
            onSuccessItem: successContent,
            onErrorItem: log,
            alias: 'contentFile'
        });
        $scope.thumbuploader = new fileUploader({
            url: "/Entity/AddThumbnail/Content",
            autoUpload: true,
            onSuccessItem: successThumb,
            onErrorItem: log,
            alias: 'thumbnail'
        });

        $scope.relatedFileUploader = new fileUploader({
            url: "/Content/Add/AssociatedContent",
            autoUpload: true,
            onSuccessItem: successRelated,
            onErrorItem: log,
            alias: 'associatedFile'
        });
        function log() {
            console.log({ uploader: arguments });
        }
        function successContent(xhr, response) {
            console.log(arguments, { content: $scope.content });
            var content = response.contentData;
            $.each(content, function (k, v) {
                $scope.content[k] = v;

            });
            if (content.TourTitle) {
                $scope.content.FileName = content.TourTitle;
                $scope.content.Description = content.TourDescription;
                if (content.TourDistributedBy) {
                    $scope.content.DistributedBy = content.TourDistributedBy;
                    if (response.extendedData) {
                        $scope.content.Citation = response.extendedData.citation;
                        var tags = response.extendedData.tags.split(';').join(',');
                        $scope.content.Tags = tags;
                        if (response.extendedData.author) {
                            $scope.content.DistributedBy = response.extendedData.author;
                        }
                    }
                }
            } else {
                var split = response.ContentFileName.split('.');
                split.pop();
                $scope.content.FileName = split.join('.');
            }
            $scope.content.Name = $scope.content.FileName;
            //$('#lstCommunity').val($scope.content.ParentID);//wth??
        };
        function successRelated(xhr, response) {
            if (!$scope.content.PostedFileName) {
                $scope.content.PostedFileName = [];
                $scope.content.PostedFileDetail = [];
            }
            $scope.content.PostedFileDetail.push(response.fileDetailString);
            $scope.content.PostedFileName.push(response.fileName);
        };

        function successThumb(xhr, response) {
            $timeout(function () {
                $scope.content.ThumbnailID = response.ThumbnailID;
                $scope.editedThumb = true;
                //$('#lstCommunity').val($scope.content.ParentID);
            });
        }
        $scope.addRelatedLink = function () {
            if (!$scope.content.PostedFileName) {
                $scope.content.PostedFileName = [];
                $scope.content.PostedFileDetail = [];
            }
            $scope.content.PostedFileDetail.push("link~0~0~link~-1");
            $scope.content.PostedFileName.push($scope.relatedLink);
            $scope.relatedLink = '';
        };

        $scope.getBytesFromDetail = function (detail) {
            var bytePart = detail.split('~')[1];
            if (bytePart !== '0') {
                return '(' + uiHelper.getFileSizeString(bytePart) + ')';
            } else return '';
        };

        $scope.getFullFileName = function (name, detail) {
            var split = name.split('.');
            var ext = detail.split('~')[0];
            if (ext === 'link') {
                return name;
            } else if (split.length && ('.' + split[split.length - 1]) === ext) {
                return name;
            } else {
                return name + ext;
            }
        }

        $scope.removeAssociated = function (index) {
            $scope.content.PostedFileDetail.splice(index, 1);
            $scope.content.PostedFileName.splice(index, 1);
        }

        function init() {
            uiHelper.fixLinks('profileLink');
            $scope.relatedDetailLink = false;
            $scope.isChildContent = uiHelper.positiveIntParamExists('parentId', $routeParams, $scope);
            dataproxy.requireAuth().then(function (types) {
                $scope.types = types;
                console.log(types);
                dataproxy.getUserCommunityList().then(function (data) {
                    $.each(data, function (i, item) {
                        item.val = item.Value;
                    });
                    $scope.communities = data;
                    if (!data.length) {
                        location.href = '#/';
                        return;
                    }
                    if ($scope.isEdit) {
                        dataproxy.getEditContent($routeParams.contentId)
                            .then(function (content) {
                                $scope.content = content;
                                setTimeout(function () { $('#lstCommunity').val(content.ParentID); }, 100);

                            });
                    } else {

                        $timeout(function () {
                            $scope.content = {
                                type: 'file',
                                CategoryID: 9,
                                ParentID: '?',
                                AccessTypeID: 2,
                                IsOffensive: false,
                                IsLink: false
                            };
                            $scope.CategoryName = "General Interest";
                            if (!$scope.isChildContent) {
                                $timeout(function() {
                                    var opt = $('#lstCommunity option[label="None"]').first();
                                    opt.prop('selected', true);
                                    $('#lstCommunity').trigger('change');
                                    //$scope.content.ParentID = opt.val();
                                }, 500);
                            }
                        }, 100);
                    }
                    if ($scope.isChildContent) {
                        setTimeout(function() {
                            $('#lstCommunity').val($scope.parentId);
                            $('#lstCommunity').prop('disabled', true);
                        }, 100);
                        
                    }

                }, function (reason) {
                    location.href = '#/';
                });

            });

        }

        $scope.saveEditedContent = function () {
            if ($scope.content.ParentID.val && isNaN($scope.content.ParentID)) {
                $scope.content.ParentID = $scope.content.ParentID.val;
            }
            $scope.content.Name = $scope.content.FileName;
            console.log($scope.content);

            dataproxy.saveEditedContent($scope.content)
                .then(function (response) {
                    console.log(this, arguments);
                    if (!response.error) {
                        location.href = '#/ContentDetail/' + response.ID;
                    }
                });
        };

        $scope.publishContent = function () {
            $scope.content.ParentID = $scope.isChildContent ? $scope.parentId : $scope.content.ParentID.val;
            console.log($scope.content);
            dataproxy.publishContent($scope.content)
                .then(function (response) {
                    console.log(arguments);
                    location.href = '#/ContentDetail/' + response.ID;
                });
        };
        init();

    }]);