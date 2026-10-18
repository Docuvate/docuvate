// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'feature_flags_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FeatureFlagsResponseDto extends FeatureFlagsResponseDto {
  @override
  final bool layoutReconstructionCompare;
  @override
  final bool sourceConnectors;
  @override
  final bool experimentalResearchModels;
  @override
  final bool exactAnswers;
  @override
  final bool smartDuplicates;
  @override
  final bool answerAbstention;
  @override
  final bool learnedValueTypes;
  @override
  final bool layoutKeyValueRoles;
  @override
  final bool localChatModel;

  factory _$FeatureFlagsResponseDto(
          [void Function(FeatureFlagsResponseDtoBuilder)? updates]) =>
      (new FeatureFlagsResponseDtoBuilder()..update(updates))._build();

  _$FeatureFlagsResponseDto._(
      {required this.layoutReconstructionCompare,
      required this.sourceConnectors,
      required this.experimentalResearchModels,
      required this.exactAnswers,
      required this.smartDuplicates,
      required this.answerAbstention,
      required this.learnedValueTypes,
      required this.layoutKeyValueRoles,
      required this.localChatModel})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(layoutReconstructionCompare,
        r'FeatureFlagsResponseDto', 'layoutReconstructionCompare');
    BuiltValueNullFieldError.checkNotNull(
        sourceConnectors, r'FeatureFlagsResponseDto', 'sourceConnectors');
    BuiltValueNullFieldError.checkNotNull(experimentalResearchModels,
        r'FeatureFlagsResponseDto', 'experimentalResearchModels');
    BuiltValueNullFieldError.checkNotNull(
        exactAnswers, r'FeatureFlagsResponseDto', 'exactAnswers');
    BuiltValueNullFieldError.checkNotNull(
        smartDuplicates, r'FeatureFlagsResponseDto', 'smartDuplicates');
    BuiltValueNullFieldError.checkNotNull(
        answerAbstention, r'FeatureFlagsResponseDto', 'answerAbstention');
    BuiltValueNullFieldError.checkNotNull(
        learnedValueTypes, r'FeatureFlagsResponseDto', 'learnedValueTypes');
    BuiltValueNullFieldError.checkNotNull(
        layoutKeyValueRoles, r'FeatureFlagsResponseDto', 'layoutKeyValueRoles');
    BuiltValueNullFieldError.checkNotNull(
        localChatModel, r'FeatureFlagsResponseDto', 'localChatModel');
  }

  @override
  FeatureFlagsResponseDto rebuild(
          void Function(FeatureFlagsResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FeatureFlagsResponseDtoBuilder toBuilder() =>
      new FeatureFlagsResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FeatureFlagsResponseDto &&
        layoutReconstructionCompare == other.layoutReconstructionCompare &&
        sourceConnectors == other.sourceConnectors &&
        experimentalResearchModels == other.experimentalResearchModels &&
        exactAnswers == other.exactAnswers &&
        smartDuplicates == other.smartDuplicates &&
        answerAbstention == other.answerAbstention &&
        learnedValueTypes == other.learnedValueTypes &&
        layoutKeyValueRoles == other.layoutKeyValueRoles &&
        localChatModel == other.localChatModel;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, layoutReconstructionCompare.hashCode);
    _$hash = $jc(_$hash, sourceConnectors.hashCode);
    _$hash = $jc(_$hash, experimentalResearchModels.hashCode);
    _$hash = $jc(_$hash, exactAnswers.hashCode);
    _$hash = $jc(_$hash, smartDuplicates.hashCode);
    _$hash = $jc(_$hash, answerAbstention.hashCode);
    _$hash = $jc(_$hash, learnedValueTypes.hashCode);
    _$hash = $jc(_$hash, layoutKeyValueRoles.hashCode);
    _$hash = $jc(_$hash, localChatModel.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FeatureFlagsResponseDto')
          ..add('layoutReconstructionCompare', layoutReconstructionCompare)
          ..add('sourceConnectors', sourceConnectors)
          ..add('experimentalResearchModels', experimentalResearchModels)
          ..add('exactAnswers', exactAnswers)
          ..add('smartDuplicates', smartDuplicates)
          ..add('answerAbstention', answerAbstention)
          ..add('learnedValueTypes', learnedValueTypes)
          ..add('layoutKeyValueRoles', layoutKeyValueRoles)
          ..add('localChatModel', localChatModel))
        .toString();
  }
}

class FeatureFlagsResponseDtoBuilder
    implements
        Builder<FeatureFlagsResponseDto, FeatureFlagsResponseDtoBuilder> {
  _$FeatureFlagsResponseDto? _$v;

  bool? _layoutReconstructionCompare;
  bool? get layoutReconstructionCompare => _$this._layoutReconstructionCompare;
  set layoutReconstructionCompare(bool? layoutReconstructionCompare) =>
      _$this._layoutReconstructionCompare = layoutReconstructionCompare;

  bool? _sourceConnectors;
  bool? get sourceConnectors => _$this._sourceConnectors;
  set sourceConnectors(bool? sourceConnectors) =>
      _$this._sourceConnectors = sourceConnectors;

  bool? _experimentalResearchModels;
  bool? get experimentalResearchModels => _$this._experimentalResearchModels;
  set experimentalResearchModels(bool? experimentalResearchModels) =>
      _$this._experimentalResearchModels = experimentalResearchModels;

  bool? _exactAnswers;
  bool? get exactAnswers => _$this._exactAnswers;
  set exactAnswers(bool? exactAnswers) => _$this._exactAnswers = exactAnswers;

  bool? _smartDuplicates;
  bool? get smartDuplicates => _$this._smartDuplicates;
  set smartDuplicates(bool? smartDuplicates) =>
      _$this._smartDuplicates = smartDuplicates;

  bool? _answerAbstention;
  bool? get answerAbstention => _$this._answerAbstention;
  set answerAbstention(bool? answerAbstention) =>
      _$this._answerAbstention = answerAbstention;

  bool? _learnedValueTypes;
  bool? get learnedValueTypes => _$this._learnedValueTypes;
  set learnedValueTypes(bool? learnedValueTypes) =>
      _$this._learnedValueTypes = learnedValueTypes;

  bool? _layoutKeyValueRoles;
  bool? get layoutKeyValueRoles => _$this._layoutKeyValueRoles;
  set layoutKeyValueRoles(bool? layoutKeyValueRoles) =>
      _$this._layoutKeyValueRoles = layoutKeyValueRoles;

  bool? _localChatModel;
  bool? get localChatModel => _$this._localChatModel;
  set localChatModel(bool? localChatModel) =>
      _$this._localChatModel = localChatModel;

  FeatureFlagsResponseDtoBuilder() {
    FeatureFlagsResponseDto._defaults(this);
  }

  FeatureFlagsResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _layoutReconstructionCompare = $v.layoutReconstructionCompare;
      _sourceConnectors = $v.sourceConnectors;
      _experimentalResearchModels = $v.experimentalResearchModels;
      _exactAnswers = $v.exactAnswers;
      _smartDuplicates = $v.smartDuplicates;
      _answerAbstention = $v.answerAbstention;
      _learnedValueTypes = $v.learnedValueTypes;
      _layoutKeyValueRoles = $v.layoutKeyValueRoles;
      _localChatModel = $v.localChatModel;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FeatureFlagsResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$FeatureFlagsResponseDto;
  }

  @override
  void update(void Function(FeatureFlagsResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FeatureFlagsResponseDto build() => _build();

  _$FeatureFlagsResponseDto _build() {
    final _$result = _$v ??
        new _$FeatureFlagsResponseDto._(
            layoutReconstructionCompare: BuiltValueNullFieldError.checkNotNull(
                layoutReconstructionCompare, r'FeatureFlagsResponseDto', 'layoutReconstructionCompare'),
            sourceConnectors: BuiltValueNullFieldError.checkNotNull(
                sourceConnectors, r'FeatureFlagsResponseDto', 'sourceConnectors'),
            experimentalResearchModels: BuiltValueNullFieldError.checkNotNull(
                experimentalResearchModels, r'FeatureFlagsResponseDto', 'experimentalResearchModels'),
            exactAnswers: BuiltValueNullFieldError.checkNotNull(
                exactAnswers, r'FeatureFlagsResponseDto', 'exactAnswers'),
            smartDuplicates: BuiltValueNullFieldError.checkNotNull(
                smartDuplicates, r'FeatureFlagsResponseDto', 'smartDuplicates'),
            answerAbstention: BuiltValueNullFieldError.checkNotNull(
                answerAbstention, r'FeatureFlagsResponseDto', 'answerAbstention'),
            learnedValueTypes: BuiltValueNullFieldError.checkNotNull(
                learnedValueTypes, r'FeatureFlagsResponseDto', 'learnedValueTypes'),
            layoutKeyValueRoles: BuiltValueNullFieldError.checkNotNull(layoutKeyValueRoles, r'FeatureFlagsResponseDto', 'layoutKeyValueRoles'),
            localChatModel: BuiltValueNullFieldError.checkNotNull(localChatModel, r'FeatureFlagsResponseDto', 'localChatModel'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
