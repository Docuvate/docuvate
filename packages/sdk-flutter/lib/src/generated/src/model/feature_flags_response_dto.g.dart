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

  factory _$FeatureFlagsResponseDto(
          [void Function(FeatureFlagsResponseDtoBuilder)? updates]) =>
      (new FeatureFlagsResponseDtoBuilder()..update(updates))._build();

  _$FeatureFlagsResponseDto._(
      {required this.layoutReconstructionCompare,
      required this.sourceConnectors,
      required this.experimentalResearchModels})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(layoutReconstructionCompare,
        r'FeatureFlagsResponseDto', 'layoutReconstructionCompare');
    BuiltValueNullFieldError.checkNotNull(
        sourceConnectors, r'FeatureFlagsResponseDto', 'sourceConnectors');
    BuiltValueNullFieldError.checkNotNull(experimentalResearchModels,
        r'FeatureFlagsResponseDto', 'experimentalResearchModels');
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
    return (newBuiltValueToStringHelper(r'FeatureFlagsResponseDto')
          ..add('layoutReconstructionCompare', layoutReconstructionCompare)
          ..add('sourceConnectors', sourceConnectors)
          ..add('experimentalResearchModels', experimentalResearchModels))
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

  FeatureFlagsResponseDtoBuilder() {
    FeatureFlagsResponseDto._defaults(this);
  }

  FeatureFlagsResponseDtoBuilder get _$this {
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
                layoutReconstructionCompare,
                r'FeatureFlagsResponseDto',
                'layoutReconstructionCompare'),
            sourceConnectors: BuiltValueNullFieldError.checkNotNull(
                sourceConnectors,
                r'FeatureFlagsResponseDto',
                'sourceConnectors'),
            experimentalResearchModels: BuiltValueNullFieldError.checkNotNull(
                experimentalResearchModels,
                r'FeatureFlagsResponseDto',
                'experimentalResearchModels'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
