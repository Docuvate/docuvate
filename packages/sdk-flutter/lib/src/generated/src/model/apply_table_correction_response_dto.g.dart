// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'apply_table_correction_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ApplyTableCorrectionResponseDto
    extends ApplyTableCorrectionResponseDto {
  @override
  final bool noChange;
  @override
  final DocumentCorrectionDto correction;
  @override
  final DocumentRegionDto region;

  factory _$ApplyTableCorrectionResponseDto(
          [void Function(ApplyTableCorrectionResponseDtoBuilder)? updates]) =>
      (new ApplyTableCorrectionResponseDtoBuilder()..update(updates))._build();

  _$ApplyTableCorrectionResponseDto._(
      {required this.noChange, required this.correction, required this.region})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        noChange, r'ApplyTableCorrectionResponseDto', 'noChange');
    BuiltValueNullFieldError.checkNotNull(
        correction, r'ApplyTableCorrectionResponseDto', 'correction');
    BuiltValueNullFieldError.checkNotNull(
        region, r'ApplyTableCorrectionResponseDto', 'region');
  }

  @override
  ApplyTableCorrectionResponseDto rebuild(
          void Function(ApplyTableCorrectionResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ApplyTableCorrectionResponseDtoBuilder toBuilder() =>
      new ApplyTableCorrectionResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ApplyTableCorrectionResponseDto &&
        noChange == other.noChange &&
        correction == other.correction &&
        region == other.region;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, noChange.hashCode);
    _$hash = $jc(_$hash, correction.hashCode);
    _$hash = $jc(_$hash, region.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ApplyTableCorrectionResponseDto')
          ..add('noChange', noChange)
          ..add('correction', correction)
          ..add('region', region))
        .toString();
  }
}

class ApplyTableCorrectionResponseDtoBuilder
    implements
        Builder<ApplyTableCorrectionResponseDto,
            ApplyTableCorrectionResponseDtoBuilder> {
  _$ApplyTableCorrectionResponseDto? _$v;

  bool? _noChange;
  bool? get noChange => _$this._noChange;
  set noChange(bool? noChange) => _$this._noChange = noChange;

  DocumentCorrectionDtoBuilder? _correction;
  DocumentCorrectionDtoBuilder get correction =>
      _$this._correction ??= new DocumentCorrectionDtoBuilder();
  set correction(DocumentCorrectionDtoBuilder? correction) =>
      _$this._correction = correction;

  DocumentRegionDtoBuilder? _region;
  DocumentRegionDtoBuilder get region =>
      _$this._region ??= new DocumentRegionDtoBuilder();
  set region(DocumentRegionDtoBuilder? region) => _$this._region = region;

  ApplyTableCorrectionResponseDtoBuilder() {
    ApplyTableCorrectionResponseDto._defaults(this);
  }

  ApplyTableCorrectionResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _noChange = $v.noChange;
      _correction = $v.correction.toBuilder();
      _region = $v.region.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ApplyTableCorrectionResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ApplyTableCorrectionResponseDto;
  }

  @override
  void update(void Function(ApplyTableCorrectionResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ApplyTableCorrectionResponseDto build() => _build();

  _$ApplyTableCorrectionResponseDto _build() {
    _$ApplyTableCorrectionResponseDto _$result;
    try {
      _$result = _$v ??
          new _$ApplyTableCorrectionResponseDto._(
              noChange: BuiltValueNullFieldError.checkNotNull(
                  noChange, r'ApplyTableCorrectionResponseDto', 'noChange'),
              correction: correction.build(),
              region: region.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'correction';
        correction.build();
        _$failedField = 'region';
        region.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'ApplyTableCorrectionResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
