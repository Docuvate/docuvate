// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'apply_label_correction_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ApplyLabelCorrectionResponseDto
    extends ApplyLabelCorrectionResponseDto {
  @override
  final bool ok;
  @override
  final String correctionId;
  @override
  final num similarDocumentsUpdated;

  factory _$ApplyLabelCorrectionResponseDto(
          [void Function(ApplyLabelCorrectionResponseDtoBuilder)? updates]) =>
      (new ApplyLabelCorrectionResponseDtoBuilder()..update(updates))._build();

  _$ApplyLabelCorrectionResponseDto._(
      {required this.ok,
      required this.correctionId,
      required this.similarDocumentsUpdated})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        ok, r'ApplyLabelCorrectionResponseDto', 'ok');
    BuiltValueNullFieldError.checkNotNull(
        correctionId, r'ApplyLabelCorrectionResponseDto', 'correctionId');
    BuiltValueNullFieldError.checkNotNull(similarDocumentsUpdated,
        r'ApplyLabelCorrectionResponseDto', 'similarDocumentsUpdated');
  }

  @override
  ApplyLabelCorrectionResponseDto rebuild(
          void Function(ApplyLabelCorrectionResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ApplyLabelCorrectionResponseDtoBuilder toBuilder() =>
      new ApplyLabelCorrectionResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ApplyLabelCorrectionResponseDto &&
        ok == other.ok &&
        correctionId == other.correctionId &&
        similarDocumentsUpdated == other.similarDocumentsUpdated;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, ok.hashCode);
    _$hash = $jc(_$hash, correctionId.hashCode);
    _$hash = $jc(_$hash, similarDocumentsUpdated.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ApplyLabelCorrectionResponseDto')
          ..add('ok', ok)
          ..add('correctionId', correctionId)
          ..add('similarDocumentsUpdated', similarDocumentsUpdated))
        .toString();
  }
}

class ApplyLabelCorrectionResponseDtoBuilder
    implements
        Builder<ApplyLabelCorrectionResponseDto,
            ApplyLabelCorrectionResponseDtoBuilder> {
  _$ApplyLabelCorrectionResponseDto? _$v;

  bool? _ok;
  bool? get ok => _$this._ok;
  set ok(bool? ok) => _$this._ok = ok;

  String? _correctionId;
  String? get correctionId => _$this._correctionId;
  set correctionId(String? correctionId) => _$this._correctionId = correctionId;

  num? _similarDocumentsUpdated;
  num? get similarDocumentsUpdated => _$this._similarDocumentsUpdated;
  set similarDocumentsUpdated(num? similarDocumentsUpdated) =>
      _$this._similarDocumentsUpdated = similarDocumentsUpdated;

  ApplyLabelCorrectionResponseDtoBuilder() {
    ApplyLabelCorrectionResponseDto._defaults(this);
  }

  ApplyLabelCorrectionResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _ok = $v.ok;
      _correctionId = $v.correctionId;
      _similarDocumentsUpdated = $v.similarDocumentsUpdated;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ApplyLabelCorrectionResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ApplyLabelCorrectionResponseDto;
  }

  @override
  void update(void Function(ApplyLabelCorrectionResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ApplyLabelCorrectionResponseDto build() => _build();

  _$ApplyLabelCorrectionResponseDto _build() {
    final _$result = _$v ??
        new _$ApplyLabelCorrectionResponseDto._(
            ok: BuiltValueNullFieldError.checkNotNull(
                ok, r'ApplyLabelCorrectionResponseDto', 'ok'),
            correctionId: BuiltValueNullFieldError.checkNotNull(correctionId,
                r'ApplyLabelCorrectionResponseDto', 'correctionId'),
            similarDocumentsUpdated: BuiltValueNullFieldError.checkNotNull(
                similarDocumentsUpdated,
                r'ApplyLabelCorrectionResponseDto',
                'similarDocumentsUpdated'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
