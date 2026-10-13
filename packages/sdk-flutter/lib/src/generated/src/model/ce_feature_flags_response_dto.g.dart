// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ce_feature_flags_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CeFeatureFlagsResponseDto extends CeFeatureFlagsResponseDto {
  @override
  final bool layoutReconstructionCompare;
  @override
  final bool sourceConnectors;
  @override
  final bool experimentalResearchModels;

  factory _$CeFeatureFlagsResponseDto(
          [void Function(CeFeatureFlagsResponseDtoBuilder)? updates]) =>
      (new CeFeatureFlagsResponseDtoBuilder()..update(updates))._build();

  _$CeFeatureFlagsResponseDto._(
      {required this.layoutReconstructionCompare,
      required this.sourceConnectors,
      required this.experimentalResearchModels})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(layoutReconstructionCompare,
        r'CeFeatureFlagsResponseDto', 'layoutReconstructionCompare');
    BuiltValueNullFieldError.checkNotNull(
        sourceConnectors, r'CeFeatureFlagsResponseDto', 'sourceConnectors');
    BuiltValueNullFieldError.checkNotNull(experimentalResearchModels,
        r'CeFeatureFlagsResponseDto', 'experimentalResearchModels');
  }

  @override
  CeFeatureFlagsResponseDto rebuild(
          void Function(CeFeatureFlagsResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CeFeatureFlagsResponseDtoBuilder toBuilder() =>
      new CeFeatureFlagsResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CeFeatureFlagsResponseDto &&
        layoutReconstructionCompare == other.layoutReconstructionCompare &&
        sourceConnectors == other.sourceConnectors &&
        experimentalResearchModels == other.experimentalResearchModels;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, layoutReconstructionCompare.hashCode);
    _$hash = $jc(_$hash, sourceConnectors.hashCode);
    _$hash = $jc(_$hash, experimentalResearchModels.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CeFeatureFlagsResponseDto')
          ..add('layoutReconstructionCompare', layoutReconstructionCompare)
          ..add('sourceConnectors', sourceConnectors)
          ..add('experimentalResearchModels', experimentalResearchModels))
        .toString();
  }
}

class CeFeatureFlagsResponseDtoBuilder
    implements
        Builder<CeFeatureFlagsResponseDto, CeFeatureFlagsResponseDtoBuilder> {
  _$CeFeatureFlagsResponseDto? _$v;

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

  CeFeatureFlagsResponseDtoBuilder() {
    CeFeatureFlagsResponseDto._defaults(this);
  }

  CeFeatureFlagsResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _layoutReconstructionCompare = $v.layoutReconstructionCompare;
      _sourceConnectors = $v.sourceConnectors;
      _experimentalResearchModels = $v.experimentalResearchModels;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CeFeatureFlagsResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CeFeatureFlagsResponseDto;
  }

  @override
  void update(void Function(CeFeatureFlagsResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CeFeatureFlagsResponseDto build() => _build();

  _$CeFeatureFlagsResponseDto _build() {
    final _$result = _$v ??
        new _$CeFeatureFlagsResponseDto._(
            layoutReconstructionCompare: BuiltValueNullFieldError.checkNotNull(
                layoutReconstructionCompare,
                r'CeFeatureFlagsResponseDto',
                'layoutReconstructionCompare'),
            sourceConnectors: BuiltValueNullFieldError.checkNotNull(
                sourceConnectors,
                r'CeFeatureFlagsResponseDto',
                'sourceConnectors'),
            experimentalResearchModels: BuiltValueNullFieldError.checkNotNull(
                experimentalResearchModels,
                r'CeFeatureFlagsResponseDto',
                'experimentalResearchModels'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
