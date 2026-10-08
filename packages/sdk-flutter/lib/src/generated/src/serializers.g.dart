// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'serializers.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

Serializers _$serializers = (new Serializers().toBuilder()
      ..add(AcceptLabelRecommendationRequestDto.serializer)
      ..add(AcceptLabelRecommendationResponseDto.serializer)
      ..add(AddLabelRecommendationBlocklistRequestDto.serializer)
      ..add(ApiErrorEnvelopeDto.serializer)
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
      ..add(CreateTagRequestDto.serializer)
      ..add(CreateTagRequestDtoMatchingAlgorithmEnum.serializer)
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
      ..add(DocumentListResponseDto.serializer)
      ..add(DocumentPipelineModuleDescriptorDto.serializer)
      ..add(DocumentPipelineModulesResponseDto.serializer)
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
      ..add(LabelMapResponseDtoClass.serializer)
      ..add(LabelMapResponseDtoClassEmptyReasonEnum.serializer)
      ..add(LabelRecommendationBlocklistEntryResponseDto.serializer)
      ..add(LabelRecommendationBlocklistEntryResponseDtoSource_Enum.serializer)
      ..add(LabelRecommendationBlocklistListResponseDto.serializer)
      ..add(LabelRecommendationListResponseDto.serializer)
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
      ..add(ReplaceRecognizedFieldItemDto.serializer)
      ..add(ReplaceRecognizedFieldItemDtoFieldTypeEnum.serializer)
      ..add(ReplaceRecognizedFieldItemDtoGateLabelMatchEnum.serializer)
      ..add(ReplaceRecognizedFieldsRequestDto.serializer)
      ..add(ReplaceTagCustomFieldItemDto.serializer)
      ..add(ReplaceTagCustomFieldItemDtoFieldTypeEnum.serializer)
      ..add(ReplaceTagCustomFieldsRequestDto.serializer)
      ..add(SendDocumentChatThreadMessageRequestDto.serializer)
      ..add(SendDocumentChatThreadMessageResponseDto.serializer)
      ..add(SetMlModelLifecycleRequestDto.serializer)
      ..add(SetMlModelLifecycleRequestDtoLifecycleEnum.serializer)
      ..add(StartMailOAuthRequestDto.serializer)
      ..add(TagCustomFieldListResponseDto.serializer)
      ..add(TagListResponseDto.serializer)
      ..add(TriggerMlRetrainRequestDto.serializer)
      ..add(UpdateCorrespondentRequestDto.serializer)
      ..add(UpdateCorrespondentRequestDtoMatchingAlgorithmEnum.serializer)
      ..add(UpdateDocumentRequestDto.serializer)
      ..add(UpdateFolderRequestDto.serializer)
      ..add(UpdateMappeRequestDto.serializer)
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
          const FullType(BuiltList, const [const FullType(ChatMessageDto)]),
          () => new ListBuilder<ChatMessageDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(ChatMessageRecordDto)]),
          () => new ListBuilder<ChatMessageRecordDto>())
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
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(String)]),
          () => new MapBuilder<String, String>())
      ..addBuilderFactory(
          const FullType(
              BuiltMap, const [const FullType(String), const FullType(num)]),
          () => new MapBuilder<String, num>()))
    .build();

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
