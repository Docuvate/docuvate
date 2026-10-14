// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'trigger_ml_retrain_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TriggerMlRetrainRequestDto extends TriggerMlRetrainRequestDto {
  @override
  final String familyId;

  factory _$TriggerMlRetrainRequestDto(
          [void Function(TriggerMlRetrainRequestDtoBuilder)? updates]) =>
      (TriggerMlRetrainRequestDtoBuilder()..update(updates))._build();

  _$TriggerMlRetrainRequestDto._({required this.familyId}) : super._();
  @override
  TriggerMlRetrainRequestDto rebuild(
          void Function(TriggerMlRetrainRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TriggerMlRetrainRequestDtoBuilder toBuilder() =>
      TriggerMlRetrainRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TriggerMlRetrainRequestDto && familyId == other.familyId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, familyId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TriggerMlRetrainRequestDto')
          ..add('familyId', familyId))
        .toString();
  }
}

class TriggerMlRetrainRequestDtoBuilder
    implements
        Builder<TriggerMlRetrainRequestDto, TriggerMlRetrainRequestDtoBuilder> {
  _$TriggerMlRetrainRequestDto? _$v;

  String? _familyId;
  String? get familyId => _$this._familyId;
  set familyId(String? familyId) => _$this._familyId = familyId;

  TriggerMlRetrainRequestDtoBuilder() {
    TriggerMlRetrainRequestDto._defaults(this);
  }

  TriggerMlRetrainRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _familyId = $v.familyId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TriggerMlRetrainRequestDto other) {
    _$v = other as _$TriggerMlRetrainRequestDto;
  }

  @override
  void update(void Function(TriggerMlRetrainRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TriggerMlRetrainRequestDto build() => _build();

  _$TriggerMlRetrainRequestDto _build() {
    final _$result = _$v ??
        _$TriggerMlRetrainRequestDto._(
          familyId: BuiltValueNullFieldError.checkNotNull(
              familyId, r'TriggerMlRetrainRequestDto', 'familyId'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
