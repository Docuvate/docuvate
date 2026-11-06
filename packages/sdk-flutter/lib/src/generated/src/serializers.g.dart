// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'serializers.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

Serializers _$serializers = (Serializers().toBuilder()
      ..add(AcceptDocumentReviewBatchRequestDto.serializer)
      ..add(AcceptDocumentReviewBatchResponseDtoClass.serializer)
      ..add(AcceptDocumentReviewResponseDtoClass.serializer)
      ..add(AcceptLabelRecommendationRequestDto.serializer)
      ..add(AcceptLabelRecommendationResponseDto.serializer)
      ..add(AcceptUserInvitationRequestDto.serializer)
      ..add(AddLabelRecommendationBlocklistRequestDto.serializer)
      ..add(AdminAccessResponseDto.serializer)
      ..add(AdminAccessResponseDtoRoleEnum.serializer)
      ..add(AdminAuthSignInSettingsResponseDto.serializer)
      ..add(AdminOidcProviderResponseDto.serializer)
      ..add(AdminOidcProviderResponseDtoSource_Enum.serializer)
      ..add(AdminUserListResponseDto.serializer)
      ..add(AdminUserResponseDto.serializer)
      ..add(AdminUserResponseDtoAccountStatusEnum.serializer)
      ..add(AdminUserResponseDtoRoleEnum.serializer)
      ..add(ApplyFieldCorrectionRequestDto.serializer)
      ..add(ApplyFieldCorrectionRequestDtoOpEnum.serializer)
      ..add(ApplyFieldCorrectionRequestDtoScopeEnum.serializer)
      ..add(ApplyFieldCorrectionRequestDtoShapeEnum.serializer)
      ..add(ApplyFieldCorrectionResponseDto.serializer)
      ..add(ApplyLabelCorrectionRequestDto.serializer)
      ..add(ApplyLabelCorrectionResponseDto.serializer)
      ..add(ApplyTableCorrectionRequestDto.serializer)
      ..add(ApplyTableCorrectionRequestDtoOpEnum.serializer)
      ..add(ApplyTableCorrectionRequestDtoShapeEnum.serializer)
      ..add(ApplyTableCorrectionRequestDtoTableTypeEnum.serializer)
      ..add(ApplyTableCorrectionResponseDto.serializer)
      ..add(AuthOidcProviderPublicResponseDto.serializer)
      ..add(AuthSignInOptionsResponseDto.serializer)
      ..add(BanAdminUserRequestDto.serializer)
      ..add(ConfirmDocumentFieldRequestDto.serializer)
      ..add(ConfirmDocumentFieldResponseDto.serializer)
      ..add(ConfirmLabelRecommendationBlocklistPatternRequestDto.serializer)
      ..add(CreateAdminOidcProviderRequestDto.serializer)
      ..add(CreateConnectorInstallationRequestDto.serializer)
      ..add(CreateConnectorInstallationRequestDtoPluginIdEnum.serializer)
      ..add(CreateFolderRequestDto.serializer)
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
      ..add(DashboardWidgetDocumentPreviewsResponseDtoClass.serializer)
      ..add(DashboardWidgetDtoClass.serializer)
      ..add(DashboardWidgetDtoClassTypeEnum.serializer)
      ..add(DashboardWidgetInputDto.serializer)
      ..add(DashboardWidgetInputDtoTypeEnum.serializer)
      ..add(DismissLabelRecommendationRequestDto.serializer)
      ..add(DismissTagSuggestionRequestDto.serializer)
      ..add(DocumentBulkActionDto.serializer)
      ..add(DocumentBulkActionDtoActionEnum.serializer)
      ..add(DocumentBulkRequestDto.serializer)
      ..add(DocumentCorrectionDto.serializer)
      ..add(DocumentCorrectionDtoKindEnum.serializer)
      ..add(DocumentCorrectionDtoStatusEnum.serializer)
      ..add(DocumentDuplicateStackSummaryDtoClass.serializer)
      ..add(DocumentExtractionImageDto.serializer)
      ..add(DocumentExtractionImageDtoKindEnum.serializer)
      ..add(DocumentExtractionSummaryDto.serializer)
      ..add(DocumentExtractionSummaryDtoLayoutIrPagesInner.serializer)
      ..add(DocumentLayoutTokensResponseDto.serializer)
      ..add(DocumentListLibraryUiDto.serializer)
      ..add(DocumentListResponseDto.serializer)
      ..add(DocumentPipelineModuleDescriptorDto.serializer)
      ..add(DocumentPipelineModulesResponseDto.serializer)
      ..add(DocumentRegionDto.serializer)
      ..add(DocumentRegionDtoRoleEnum.serializer)
      ..add(DocumentRegionDtoShapeEnum.serializer)
      ..add(DocumentRegionFieldDto.serializer)
      ..add(DocumentRegionListResponseDto.serializer)
      ..add(DocumentRegionTableCellDto.serializer)
      ..add(DocumentRegionTableDto.serializer)
      ..add(DocumentRegionTableDtoTableTypeEnum.serializer)
      ..add(DocumentRegionTableMergeDto.serializer)
      ..add(DocumentRegionTableRowRoleDto.serializer)
      ..add(DocumentRegionTableRowRoleDtoRoleEnum.serializer)
      ..add(DocumentRegionTableRuleDto.serializer)
      ..add(DocumentRegionTableRuleDtoAxisEnum.serializer)
      ..add(DocumentRegionTableRuleDtoLineEnum.serializer)
      ..add(DocumentResponseDto.serializer)
      ..add(DocumentResponseDtoStatusEnum.serializer)
      ..add(DocumentReviewFieldSuggestionDtoClass.serializer)
      ..add(DocumentReviewQueueItemDtoClass.serializer)
      ..add(DocumentReviewQueueResponseDtoClass.serializer)
      ..add(DocumentReviewQueueSummaryDtoClass.serializer)
      ..add(DocumentTagSuggestionsBatchItemDto.serializer)
      ..add(DocumentTagSuggestionsBatchRequestDto.serializer)
      ..add(DocumentTagSuggestionsBatchResponseDto.serializer)
      ..add(DuplicateSetListResponseDtoClass.serializer)
      ..add(DuplicateStackKeepVersionRequestDto.serializer)
      ..add(DuplicateStackNotDuplicateRequestDto.serializer)
      ..add(DuplicateStackSetPrimaryRequestDto.serializer)
      ..add(EncoderReindexProgressDto.serializer)
      ..add(ExportToConnectorRequestDto.serializer)
      ..add(ExtractedFieldDto.serializer)
      ..add(ExtractionArenaRatingRequestDto.serializer)
      ..add(ExtractionBlockDto.serializer)
      ..add(ExtractionCompareRequestDto.serializer)
      ..add(ExtractionEngineListResponseDto.serializer)
      ..add(FeatureFlagsResponseDto.serializer)
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
      ..add(LabelRecommendationListResponseDtoStateEnum.serializer)
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
      ..add(LayoutTokenDto.serializer)
      ..add(LayoutTypstResponseDto.serializer)
      ..add(LayoutTypstResponseDtoExportModeEnum.serializer)
      ..add(LibraryTableColumnId.serializer)
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
      ..add(MoveDocumentsPreviousFolderDto.serializer)
      ..add(MoveDocumentsRequestDto.serializer)
      ..add(MoveDocumentsResponseDto.serializer)
      ..add(OkResponseDto.serializer)
      ..add(PasswordPolicyResponseDto.serializer)
      ..add(PreviewConnectorSourceNodesRequestDto.serializer)
      ..add(ProblemDetailsDto.serializer)
      ..add(RecognizedFieldFilterValuesResponseDto.serializer)
      ..add(RemoteConfigResponseDto.serializer)
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
      ..add(SavedDocumentViewFieldFilterDtoClass.serializer)
      ..add(SavedDocumentViewListResponseDto.serializer)
      ..add(SetAdminUserFeatureFlagRequestDto.serializer)
      ..add(SetAdminUserFeatureFlagRequestDtoFlagEnum.serializer)
      ..add(SetAdminUserRoleRequestDto.serializer)
      ..add(SetAdminUserRoleRequestDtoRoleEnum.serializer)
      ..add(SetMlModelLifecycleRequestDto.serializer)
      ..add(SetMlModelLifecycleRequestDtoLifecycleEnum.serializer)
      ..add(SftpIngressCreateAccountBodyDto.serializer)
      ..add(StartMailOAuthRequestDto.serializer)
      ..add(TableMergeInputDto.serializer)
      ..add(TableRowRoleInputDto.serializer)
      ..add(TableRowRoleInputDtoRoleEnum.serializer)
      ..add(TableRuleLineInputDto.serializer)
      ..add(TableRuleLineInputDtoAxisEnum.serializer)
      ..add(TableRuleLineInputDtoLineEnum.serializer)
      ..add(TagCustomFieldListResponseDtoClass.serializer)
      ..add(TagListResponseDto.serializer)
      ..add(TagSearchResponseDto.serializer)
      ..add(TestPaperlessConnectionRequestDto.serializer)
      ..add(TestPaperlessInstallationConnectionRequestDto.serializer)
      ..add(TriggerMlRetrainRequestDto.serializer)
      ..add(UpdateAdminOidcProviderRequestDto.serializer)
      ..add(UpdateConnectorInstallationRequestDto.serializer)
      ..add(UpdateDocumentRequestDto.serializer)
      ..add(UpdateFolderRequestDto.serializer)
      ..add(UpdatePaperlessInstallationRequestDto.serializer)
      ..add(UpdatePasswordPolicyRequestDto.serializer)
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
      ..add(UpdateWorkspaceMlSettingsRequestDto.serializer)
      ..add(
          UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum.serializer)
      ..add(UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum.serializer)
      ..add(UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum.serializer)
      ..add(UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum.serializer)
      ..add(UserSettingsResponseDto.serializer)
      ..add(UserSettingsResponseDtoLocaleEnum.serializer)
      ..add(UserSettingsResponseDtoThemePreferenceEnum.serializer)
      ..add(WorkspaceMlSettingsResponseDto.serializer)
      ..add(WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum.serializer)
      ..add(WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum.serializer)
      ..add(WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum.serializer)
      ..add(WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum.serializer)
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(AdminOidcProviderResponseDto)]),
          () => ListBuilder<AdminOidcProviderResponseDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(AdminUserResponseDto)]),
          () => ListBuilder<AdminUserResponseDto>())
      ..addBuilderFactory(
          const FullType(BuiltList,
              const [const FullType(AuthOidcProviderPublicResponseDto)]),
          () => ListBuilder<AuthOidcProviderPublicResponseDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [
            const FullType(
                BuiltList, const [const FullType(LayoutIrTableCellDto)])
          ]),
          () => ListBuilder<BuiltList<LayoutIrTableCellDto>>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DashboardWidgetDtoClass)]),
          () => ListBuilder<DashboardWidgetDtoClass>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DashboardWidgetInputDto)]),
          () => ListBuilder<DashboardWidgetInputDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DashboardWidgetInputDto)]),
          () => ListBuilder<DashboardWidgetInputDto>())
      ..addBuilderFactory(
          const FullType(BuiltList,
              const [const FullType(DocumentPipelineModuleDescriptorDto)]),
          () => ListBuilder<DocumentPipelineModuleDescriptorDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(DocumentRegionDto)]),
          () => ListBuilder<DocumentRegionDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DocumentRegionTableRowRoleDto)]),
          () => ListBuilder<DocumentRegionTableRowRoleDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DocumentRegionTableRuleDto)]),
          () => ListBuilder<DocumentRegionTableRuleDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DocumentRegionTableMergeDto)]),
          () => ListBuilder<DocumentRegionTableMergeDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DocumentRegionTableCellDto)]),
          () => ListBuilder<DocumentRegionTableCellDto>())
      ..addBuilderFactory(
          const FullType(BuiltList,
              const [const FullType(DocumentReviewQueueItemDtoClass)]),
          () => ListBuilder<DocumentReviewQueueItemDtoClass>())
      ..addBuilderFactory(
          const FullType(BuiltList,
              const [const FullType(DocumentTagSuggestionsBatchItemDto)]),
          () => ListBuilder<DocumentTagSuggestionsBatchItemDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(ExtractedFieldDto)]),
          () => ListBuilder<ExtractedFieldDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(DocumentExtractionImageDto)]),
          () => ListBuilder<DocumentExtractionImageDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [
            const FullType(DocumentExtractionSummaryDtoLayoutIrPagesInner)
          ]),
          () => ListBuilder<DocumentExtractionSummaryDtoLayoutIrPagesInner>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList,
              const [const FullType(DocumentReviewFieldSuggestionDtoClass)]),
          () => ListBuilder<DocumentReviewFieldSuggestionDtoClass>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(LayoutComparePageMetricDto)]),
          () => ListBuilder<LayoutComparePageMetricDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutIrBlockDto)]),
          () => ListBuilder<LayoutIrBlockDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutIrLineDto)]),
          () => ListBuilder<LayoutIrLineDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutIrTableDto)]),
          () => ListBuilder<LayoutIrTableDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutIrVectorDto)]),
          () => ListBuilder<LayoutIrVectorDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutIrWidgetDto)]),
          () => ListBuilder<LayoutIrWidgetDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutIrPageDto)]),
          () => ListBuilder<LayoutIrPageDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(LayoutTokenDto)]),
          () => ListBuilder<LayoutTokenDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(LibraryTableColumnId)]),
          () => ListBuilder<LibraryTableColumnId>())
      ..addBuilderFactory(
          const FullType(BuiltList,
              const [const FullType(SavedDocumentViewFieldFilterDtoClass)]),
          () => ListBuilder<SavedDocumentViewFieldFilterDtoClass>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(LibraryTableColumnId)]),
          () => ListBuilder<LibraryTableColumnId>())
      ..addBuilderFactory(
          const FullType(BuiltList,
              const [const FullType(SavedDocumentViewFieldFilterDtoClass)]),
          () => ListBuilder<SavedDocumentViewFieldFilterDtoClass>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(LibraryTableColumnId)]),
          () => ListBuilder<LibraryTableColumnId>())
      ..addBuilderFactory(
          const FullType(BuiltList,
              const [const FullType(SavedDocumentViewFieldFilterDtoClass)]),
          () => ListBuilder<SavedDocumentViewFieldFilterDtoClass>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(MlModelFamilyDto)]),
          () => ListBuilder<MlModelFamilyDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(MlModelVersionDto)]),
          () => ListBuilder<MlModelVersionDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(MlRetrainJobDto)]),
          () => ListBuilder<MlRetrainJobDto>())
      ..addBuilderFactory(
          const FullType(BuiltList,
              const [const FullType(MoveDocumentsPreviousFolderDto)]),
          () => ListBuilder<MoveDocumentsPreviousFolderDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(ReplaceRecognizedFieldItemDto)]),
          () => ListBuilder<ReplaceRecognizedFieldItemDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(ReplaceTagCustomFieldItemDto)]),
          () => ListBuilder<ReplaceTagCustomFieldItemDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(SavedDocumentViewDtoClass)]),
          () => ListBuilder<SavedDocumentViewDtoClass>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(ExtractedFieldDto)]),
          () => ListBuilder<ExtractedFieldDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(ExtractionBlockDto)]),
          () => ListBuilder<ExtractionBlockDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(num)]),
          () => ListBuilder<num>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(num)]),
          () => ListBuilder<num>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(num)]),
          () => ListBuilder<num>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(TableRowRoleInputDto)]),
          () => ListBuilder<TableRowRoleInputDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(TableRuleLineInputDto)]),
          () => ListBuilder<TableRuleLineInputDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(TableMergeInputDto)]),
          () => ListBuilder<TableMergeInputDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(num)]),
          () => ListBuilder<num>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(num)]),
          () => ListBuilder<num>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(num)]),
          () => ListBuilder<num>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(num)]),
          () => ListBuilder<num>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(String)]),
          () => MapBuilder<String, String>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(String)]),
          () => MapBuilder<String, String>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(String)]),
          () => MapBuilder<String, String>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(String)]),
          () => MapBuilder<String, String>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(String)]),
          () => MapBuilder<String, String>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(num)]),
          () => MapBuilder<String, num>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(num)]),
          () => MapBuilder<String, num>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [
            const FullType(DashboardStatisticsDtoClassTopLabelsInner)
          ]),
          () => ListBuilder<DashboardStatisticsDtoClassTopLabelsInner>()))
    .build();

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
