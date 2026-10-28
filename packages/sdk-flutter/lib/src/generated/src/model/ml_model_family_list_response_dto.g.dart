// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ml_model_family_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MlModelFamilyListResponseDto extends MlModelFamilyListResponseDto {
  @override
  final BuiltList<MlModelFamilyDto> families;

  factory _$MlModelFamilyListResponseDto(
          [void Function(MlModelFamilyListResponseDtoBuilder)? updates]) =>
      (new MlModelFamilyListResponseDtoBuilder()..update(updates))._build();

  _$MlModelFamilyListResponseDto._({required this.families}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        families, r'MlModelFamilyListResponseDto', 'families');
  }

  @override
  MlModelFamilyListResponseDto rebuild(
          void Function(MlModelFamilyListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MlModelFamilyListResponseDtoBuilder toBuilder() =>
      new MlModelFamilyListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MlModelFamilyListResponseDto && families == other.families;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, families.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MlModelFamilyListResponseDto')
          ..add('families', families))
        .toString();
  }
}

class MlModelFamilyListResponseDtoBuilder
    implements
        Builder<MlModelFamilyListResponseDto,
            MlModelFamilyListResponseDtoBuilder> {
  _$MlModelFamilyListResponseDto? _$v;

  ListBuilder<MlModelFamilyDto>? _families;
  ListBuilder<MlModelFamilyDto> get families =>
      _$this._families ??= new ListBuilder<MlModelFamilyDto>();
  set families(ListBuilder<MlModelFamilyDto>? families) =>
      _$this._families = families;

  MlModelFamilyListResponseDtoBuilder() {
    MlModelFamilyListResponseDto._defaults(this);
  }

  MlModelFamilyListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _families = $v.families.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MlModelFamilyListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$MlModelFamilyListResponseDto;
  }

  @override
  void update(void Function(MlModelFamilyListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MlModelFamilyListResponseDto build() => _build();

  _$MlModelFamilyListResponseDto _build() {
    _$MlModelFamilyListResponseDto _$result;
    try {
      _$result = _$v ??
          new _$MlModelFamilyListResponseDto._(families: families.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'families';
        families.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'MlModelFamilyListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
