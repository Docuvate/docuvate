// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'apply_label_correction_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ApplyLabelCorrectionRequestDto extends ApplyLabelCorrectionRequestDto {
  @override
  final String toTagId;

  factory _$ApplyLabelCorrectionRequestDto(
          [void Function(ApplyLabelCorrectionRequestDtoBuilder)? updates]) =>
      (ApplyLabelCorrectionRequestDtoBuilder()..update(updates))._build();

  _$ApplyLabelCorrectionRequestDto._({required this.toTagId}) : super._();
  @override
  ApplyLabelCorrectionRequestDto rebuild(
          void Function(ApplyLabelCorrectionRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ApplyLabelCorrectionRequestDtoBuilder toBuilder() =>
      ApplyLabelCorrectionRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ApplyLabelCorrectionRequestDto && toTagId == other.toTagId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, toTagId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ApplyLabelCorrectionRequestDto')
          ..add('toTagId', toTagId))
        .toString();
  }
}

class ApplyLabelCorrectionRequestDtoBuilder
    implements
        Builder<ApplyLabelCorrectionRequestDto,
            ApplyLabelCorrectionRequestDtoBuilder> {
  _$ApplyLabelCorrectionRequestDto? _$v;

  String? _toTagId;
  String? get toTagId => _$this._toTagId;
  set toTagId(String? toTagId) => _$this._toTagId = toTagId;

  ApplyLabelCorrectionRequestDtoBuilder() {
    ApplyLabelCorrectionRequestDto._defaults(this);
  }

  ApplyLabelCorrectionRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _toTagId = $v.toTagId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ApplyLabelCorrectionRequestDto other) {
    _$v = other as _$ApplyLabelCorrectionRequestDto;
  }

  @override
  void update(void Function(ApplyLabelCorrectionRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ApplyLabelCorrectionRequestDto build() => _build();

  _$ApplyLabelCorrectionRequestDto _build() {
    final _$result = _$v ??
        _$ApplyLabelCorrectionRequestDto._(
          toTagId: BuiltValueNullFieldError.checkNotNull(
              toTagId, r'ApplyLabelCorrectionRequestDto', 'toTagId'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
