// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'serializers.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

Serializers _$serializers = (new Serializers().toBuilder()
      ..add(AcceptLabelRecommendationRequestDto.serializer)
      ..add(AcceptLabelRecommendationResponseDto.serializer)
      ..add(AcceptUserInvitationRequestDto.serializer)
      ..add(AddLabelRecommendationBlocklistRequestDto.serializer)
      ..add(AdminAccessResponseDto.serializer)
      ..add(AdminAccessResponseDtoRoleEnum.serializer)
      ..add(AdminUserListResponseDto.serializer)
      ..add(AdminUserResponseDto.serializer)
      ..add(AdminUserResponseDtoAccountStatusEnum.serializer)
      ..add(AdminUserResponseDtoRoleEnum.serializer)
      ..add(ApiErrorEnvelopeDto.serializer)
      ..add(BanAdminUserRequestDto.serializer)
      ..add(ChatMessageDto.serializer)
      ..add(ChatMessageDtoRoleEnum.serializer)
      ..add(ChatMessageRecordDto.serializer)
      ..add(ChatMessageRecordDtoGenerationPhaseEnum.serializer)
      ..add(ChatMessageRecordDtoGenerationStatusEnum.serializer)
      ..add(ChatMessageRecordDtoRoleEnum.serializer)
      ..add(ConfirmLabelRecommendationBlocklistPatternRequestDto.serializer)
      ..add(CorrespondentListResponseDto.serializer)
      ..add(CreateConnectorInstallationRequestDto.serializer)
      ..add(CreateConnectorInstallationRequestDtoPluginIdEnum.serializer)
      ..add(CreateCorrespondentRequestDto.serializer)
      ..add(CreateCorrespondentRequestDtoMatchingAlgorithmEnum.serializer)
      ..add(CreateDocumentChatThreadRequestDto.serializer)
      ..add(CreateFolderRequestDto.serializer)
      ..add(CreateMappeRequestDto.serializer)
      ..add(CreateSavedDocumentViewRequestDto.serializer)
      ..add(CreateSavedDocumentViewRequestDtoFilterModeEnum.serializer)
      ..add(CreateSavedDocumentViewRequestDtoListScopeEnum.serializer)
      ..add(CreateSavedDocumentViewRequestDtoOrderEnum.serializer)
      ..add(CreateSavedDocumentViewRequestDtoSortEnum.serializer)
      ..add(CreateSavedDocumentViewRequestDtoStatusEnum.serializer)
      ..add(CreateSavedDocumentViewRequestDtoViewModeEnum.serializer)
      ..add(CreateSavedDocumentViewRequestDtoVisibilityEnum.serializer)
      ..add(CreateTagRequestDto.serializer)
      ..add(CreateTagRequestDtoMatchingAlgorithmEnum.serializer)
      ..add(DashboardLayoutResponseDto.serializer)
      ..add(DashboardStatisticsDtoClass.serializer)
      ..add(DashboardStatisticsDtoClassTopLabelsInner.serializer)
      ..add(DashboardWidgetDtoClass.serializer)
      ..add(DashboardWidgetDtoClassTypeEnum.serializer)
      ..add(DashboardWidgetInputDto.serializer)
      ..add(DashboardWidgetInputDtoTypeEnum.serializer)
      ..add(DismissLabelRecommendationRequestDto.serializer)
      ..add(DismissTagSuggestionRequestDto.serializer)
      ..add(DocumentBulkActionDto.serializer)
      ..add(DocumentBulkActionDtoActionEnum.serializer)
      ..add(DocumentBulkRequestDto.serializer)
      ..add(DocumentChatProviderInfoDto.serializer)
      ..add(DocumentChatProviderListResponseDto.serializer)
      ..add(DocumentChatProvidersCatalogMetaDto.serializer)
      ..add(DocumentChatRequestDto.serializer)
      ..add(DocumentChatResponseDto.serializer)
      ..add(DocumentChatThreadDto.serializer)
      ..add(DocumentChatThreadDtoActiveGenerationStatusEnum.serializer)
      ..add(DocumentChatThreadDtoScopeEnum.serializer)
      ..add(DocumentChatThreadListResponseDto.serializer)
      ..add(DocumentChatThreadMessagesResponseDto.serializer)
      ..add(DocumentChatUnavailableBackendInfoDto.serializer)
      ..add(DocumentExtractionSummaryDto.serializer)
      ..add(DocumentExtractionSummaryDtoLayoutIrPagesInner.serializer)
      ..add(DocumentListResponseDto.serializer)
      ..add(DocumentPipelineModuleDescriptorDto.serializer)
      ..add(DocumentPipelineModulesResponseDto.serializer)
      ..add(DocumentResponseDto.serializer)
      ..add(DocumentResponseDtoStatusEnum.serializer)
      ..add(DuplicateStackKeepVersionRequestDto.serializer)
      ..add(DuplicateStackNotDuplicateRequestDto.serializer)
      ..add(DuplicateStackSetPrimaryRequestDto.serializer)
      ..add(ExportToConnectorRequestDto.serializer)
      ..add(ExtractedFieldDto.serializer)
      ..add(ExtractionArenaRatingRequestDto.serializer)
      ..add(ExtractionBlockDto.serializer)
      ..add(ExtractionCompareRequestDto.serializer)
      ..add(ExtractionEngineListResponseDto.serializer)
      ..add(FolderListResponseDto.serializer)
      ..add(ImportFromConnectorRequestDto.serializer)
      ..add(InstallationDashboardDefaultResponseDto.serializer)
      ..add(InviteAdminUserRequestDto.serializer)
      ..add(InviteAdminUserRequestDtoRoleEnum.serializer)
      ..add(LabelMapResponseDtoClass.serializer)
      ..add(LabelMapResponseDtoClassEmptyReasonEnum.serializer)
      ..add(LabelRecommendationBlocklistEntryResponseDto.serializer)
      ..add(LabelRecommendationBlocklistEntryResponseDtoSource_Enum.serializer)
      ..add(LabelRecommendationBlocklistListResponseDto.serializer)
      ..add(LabelRecommendationListResponseDto.serializer)
      ..add(LayoutCompareMetricsResponseDto.serializer)
      ..add(LayoutComparePageMetricDto.serializer)
      ..add(LayoutComparePageResponseDto.serializer)
      ..add(LayoutCompareSummaryResponseDto.serializer)
      ..add(LayoutHtmlResponseDto.serializer)
      ..add(LayoutIrBlockDto.serializer)
      ..add(LayoutIrDocumentDto.serializer)
      ..add(LayoutIrDocumentDtoVersionEnum.serializer)
      ..add(LayoutIrLineDto.serializer)
      ..add(LayoutIrPageDto.serializer)
      ..add(LayoutIrTableCellDto.serializer)
      ..add(LayoutIrTableDto.serializer)
      ..add(LayoutIrVectorDto.serializer)
      ..add(LayoutIrVectorDtoKindEnum.serializer)
      ..add(LayoutIrWidgetDto.serializer)
      ..add(LayoutIrWidgetDtoKindEnum.serializer)
      ..add(LayoutTypstResponseDto.serializer)
      ..add(LayoutTypstResponseDtoExportModeEnum.serializer)
      ..add(LibraryTableColumnId.serializer)
      ..add(MappeListResponseDto.serializer)
      ..add(MlModelFamilyDto.serializer)
      ..add(MlModelFamilyDtoKindEnum.serializer)
      ..add(MlModelFamilyListResponseDto.serializer)
      ..add(MlModelVersionDto.serializer)
      ..add(MlModelVersionDtoLifecycleEnum.serializer)
      ..add(MlModelVersionListResponseDto.serializer)
      ..add(MlRetrainJobDto.serializer)
      ..add(MlRetrainJobDtoStatusEnum.serializer)
      ..add(MlRetrainJobDtoTriggerKindEnum.serializer)
      ..add(MlRetrainJobListResponseDto.serializer)
      ..add(OkResponseDto.serializer)
      ..add(ProposeLabelRecommendationBlocklistPatternRequestDto.serializer)
      ..add(ReorderSavedDocumentViewsRequestDto.serializer)
      ..add(ReplaceDashboardLayoutRequestDto.serializer)
      ..add(ReplaceRecognizedFieldItemDto.serializer)
      ..add(ReplaceRecognizedFieldItemDtoFieldTypeEnum.serializer)
      ..add(ReplaceRecognizedFieldItemDtoGateLabelMatchEnum.serializer)
      ..add(ReplaceRecognizedFieldsRequestDto.serializer)
      ..add(ReplaceTagCustomFieldItemDto.serializer)
      ..add(ReplaceTagCustomFieldItemDtoFieldTypeEnum.serializer)
      ..add(ReplaceTagCustomFieldsRequestDto.serializer)
      ..add(SavedDocumentViewDtoClass.serializer)
      ..add(SavedDocumentViewDtoClassFilterModeEnum.serializer)
      ..add(SavedDocumentViewDtoClassListScopeEnum.serializer)
      ..add(SavedDocumentViewDtoClassOrderEnum.serializer)
      ..add(SavedDocumentViewDtoClassSortEnum.serializer)
      ..add(SavedDocumentViewDtoClassStatusEnum.serializer)
      ..add(SavedDocumentViewDtoClassViewModeEnum.serializer)
      ..add(SavedDocumentViewDtoClassVisibilityEnum.serializer)
      ..add(SavedDocumentViewListResponseDto.serializer)
      ..add(SendDocumentChatThreadMessageRequestDto.serializer)
      ..add(SendDocumentChatThreadMessageResponseDto.serializer)
      ..add(SetAdminUserRoleRequestDto.serializer)
      ..add(SetAdminUserRoleRequestDtoRoleEnum.serializer)
      ..add(SetMlModelLifecycleRequestDto.serializer)
      ..add(SetMlModelLifecycleRequestDtoLifecycleEnum.serializer)
      ..add(SftpIngressCreateAccountBodyDto.serializer)
      ..add(StartMailOAuthRequestDto.serializer)
      ..add(TagCustomFieldListResponseDto.serializer)
      ..add(TagListResponseDto.serializer)
      ..add(TestPaperlessConnectionRequestDto.serializer)
      ..add(TestPaperlessInstallationConnectionRequestDto.serializer)
      ..add(TriggerMlRetrainRequestDto.serializer)
      ..add(UpdateCorrespondentRequestDto.serializer)
      ..add(UpdateCorrespondentRequestDtoMatchingAlgorithmEnum.serializer)
      ..add(UpdateDocumentRequestDto.serializer)
      ..add(UpdateFolderRequestDto.serializer)
      ..add(UpdateMappeRequestDto.serializer)
      ..add(UpdatePaperlessInstallationRequestDto.serializer)
      ..add(UpdateSavedDocumentViewRequestDto.serializer)
      ..add(UpdateSavedDocumentViewRequestDtoFilterModeEnum.serializer)
      ..add(UpdateSavedDocumentViewRequestDtoListScopeEnum.serializer)
      ..add(UpdateSavedDocumentViewRequestDtoOrderEnum.serializer)
      ..add(UpdateSavedDocumentViewRequestDtoSortEnum.serializer)
      ..add(UpdateSavedDocumentViewRequestDtoStatusEnum.serializer)
      ..add(UpdateSavedDocumentViewRequestDtoViewModeEnum.serializer)
      ..add(UpdateSavedDocumentViewRequestDtoVisibilityEnum.serializer)
      ..add(UpdateTagRequestDto.serializer)
      ..add(UpdateTagRequestDtoMatchingAlgorithmEnum.serializer)
      ..add(UpdateUserSettingsRequestDto.serializer)
      ..add(UpdateUserSettingsRequestDtoLocaleEnum.serializer)
      ..add(UpdateUserSettingsRequestDtoThemePreferenceEnum.serializer)
      ..add(UserSettingsResponseDto.serializer)
      ..add(UserSettingsResponseDtoDocumentChatReadinessEnum.serializer)
      ..add(UserSettingsResponseDtoLocaleEnum.serializer)
      ..add(UserSettingsResponseDtoThemePreferenceEnum.serializer)
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(AdminUserResponseDto)]),
          () => new ListBuilder<AdminUserResponseDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [
            const FullType(
                BuiltList, const [const FullType(LayoutIrTableCellDto)])
          ]),
          () => new ListBuilder<BuiltList<LayoutIrTableCellDto>>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(ChatMessageDto)]),
          () => new ListBuilder<ChatMessageDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(ChatMessageRecordDto)]),
          () => new ListBuilder<ChatMessageRecordDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DashboardWidgetDtoClass)]),
          () => new ListBuilder<DashboardWidgetDtoClass>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DashboardWidgetInputDto)]),
          () => new ListBuilder<DashboardWidgetInputDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DashboardWidgetInputDto)]),
          () => new ListBuilder<DashboardWidgetInputDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DocumentChatProviderInfoDto)]),
          () => new ListBuilder<DocumentChatProviderInfoDto>())
      ..addBuilderFactory(
          const FullType(BuiltList,
              const [const FullType(DocumentChatUnavailableBackendInfoDto)]),
          () => new ListBuilder<DocumentChatUnavailableBackendInfoDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DocumentChatProviderInfoDto)]),
          () => new ListBuilder<DocumentChatProviderInfoDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DocumentChatThreadDto)]),
          () => new ListBuilder<DocumentChatThreadDto>())
      ..addBuilderFactory(
          const FullType(BuiltList,
              const [const FullType(DocumentPipelineModuleDescriptorDto)]),
          () => new ListBuilder<DocumentPipelineModuleDescriptorDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(ExtractedFieldDto)]),
          () => new ListBuilder<ExtractedFieldDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [
            const FullType(DocumentExtractionSummaryDtoLayoutIrPagesInner)
          ]),
          () =>
              new ListBuilder<DocumentExtractionSummaryDtoLayoutIrPagesInner>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => new ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(LayoutComparePageMetricDto)]),
          () => new ListBuilder<LayoutComparePageMetricDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutIrBlockDto)]),
          () => new ListBuilder<LayoutIrBlockDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutIrLineDto)]),
          () => new ListBuilder<LayoutIrLineDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutIrTableDto)]),
          () => new ListBuilder<LayoutIrTableDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutIrVectorDto)]),
          () => new ListBuilder<LayoutIrVectorDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutIrWidgetDto)]),
          () => new ListBuilder<LayoutIrWidgetDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutIrPageDto)]),
          () => new ListBuilder<LayoutIrPageDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(LibraryTableColumnId)]),
          () => new ListBuilder<LibraryTableColumnId>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(LibraryTableColumnId)]),
          () => new ListBuilder<LibraryTableColumnId>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(LibraryTableColumnId)]),
          () => new ListBuilder<LibraryTableColumnId>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(MlModelFamilyDto)]),
          () => new ListBuilder<MlModelFamilyDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(MlModelVersionDto)]),
          () => new ListBuilder<MlModelVersionDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(MlRetrainJobDto)]),
          () => new ListBuilder<MlRetrainJobDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(ReplaceRecognizedFieldItemDto)]),
          () => new ListBuilder<ReplaceRecognizedFieldItemDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(ReplaceTagCustomFieldItemDto)]),
          () => new ListBuilder<ReplaceTagCustomFieldItemDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(SavedDocumentViewDtoClass)]),
          () => new ListBuilder<SavedDocumentViewDtoClass>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => new ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(ExtractedFieldDto)]),
          () => new ListBuilder<ExtractedFieldDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(ExtractionBlockDto)]),
          () => new ListBuilder<ExtractionBlockDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(num)]),
          () => new ListBuilder<num>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(num)]),
          () => new ListBuilder<num>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(num)]),
          () => new ListBuilder<num>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(num)]),
          () => new ListBuilder<num>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(String)]),
          () => new MapBuilder<String, String>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(String)]),
          () => new MapBuilder<String, String>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(String)]),
          () => new MapBuilder<String, String>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(String)]),
          () => new MapBuilder<String, String>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(num)]),
          () => new MapBuilder<String, num>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(num)]),
          () => new MapBuilder<String, num>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [
            const FullType(DashboardStatisticsDtoClassTopLabelsInner)
          ]),
          () => new ListBuilder<DashboardStatisticsDtoClassTopLabelsInner>()))
    .build();

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
