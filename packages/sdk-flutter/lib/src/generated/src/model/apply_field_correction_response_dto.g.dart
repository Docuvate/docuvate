// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'apply_field_correction_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ApplyFieldCorrectionResponseDto
    extends ApplyFieldCorrectionResponseDto {
  @override
  final bool noChange;
  @override
  final DocumentCorrectionDto correction;
  @override
  final DocumentRegionDto region;

  factory _$ApplyFieldCorrectionResponseDto(
          [void Function(ApplyFieldCorrectionResponseDtoBuilder)? updates]) =>
      (ApplyFieldCorrectionResponseDtoBuilder()..update(updates))._build();

  _$ApplyFieldCorrectionResponseDto._(
      {required this.noChange, required this.correction, required this.region})
      : super._();
  @override
  ApplyFieldCorrectionResponseDto rebuild(
          void Function(ApplyFieldCorrectionResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ApplyFieldCorrectionResponseDtoBuilder toBuilder() =>
      ApplyFieldCorrectionResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ApplyFieldCorrectionResponseDto &&
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
    return (newBuiltValueToStringHelper(r'ApplyFieldCorrectionResponseDto')
          ..add('noChange', noChange)
          ..add('correction', correction)
          ..add('region', region))
        .toString();
  }
}

class ApplyFieldCorrectionResponseDtoBuilder
    implements
        Builder<ApplyFieldCorrectionResponseDto,
            ApplyFieldCorrectionResponseDtoBuilder> {
  _$ApplyFieldCorrectionResponseDto? _$v;

  bool? _noChange;
  bool? get noChange => _$this._noChange;
  set noChange(bool? noChange) => _$this._noChange = noChange;

  DocumentCorrectionDtoBuilder? _correction;
  DocumentCorrectionDtoBuilder get correction =>
      _$this._correction ??= DocumentCorrectionDtoBuilder();
  set correction(DocumentCorrectionDtoBuilder? correction) =>
      _$this._correction = correction;

  DocumentRegionDtoBuilder? _region;
  DocumentRegionDtoBuilder get region =>
      _$this._region ??= DocumentRegionDtoBuilder();
  set region(DocumentRegionDtoBuilder? region) => _$this._region = region;

  ApplyFieldCorrectionResponseDtoBuilder() {
    ApplyFieldCorrectionResponseDto._defaults(this);
  }

  ApplyFieldCorrectionResponseDtoBuilder get _$this {
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
  void replace(ApplyFieldCorrectionResponseDto other) {
    _$v = other as _$ApplyFieldCorrectionResponseDto;
  }

  @override
  void update(void Function(ApplyFieldCorrectionResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ApplyFieldCorrectionResponseDto build() => _build();

  _$ApplyFieldCorrectionResponseDto _build() {
    _$ApplyFieldCorrectionResponseDto _$result;
    try {
      _$result = _$v ??
          _$ApplyFieldCorrectionResponseDto._(
            noChange: BuiltValueNullFieldError.checkNotNull(
                noChange, r'ApplyFieldCorrectionResponseDto', 'noChange'),
            correction: correction.build(),
            region: region.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'correction';
        correction.build();
        _$failedField = 'region';
        region.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ApplyFieldCorrectionResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
