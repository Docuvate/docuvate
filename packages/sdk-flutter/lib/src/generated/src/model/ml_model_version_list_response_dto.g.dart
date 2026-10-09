// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ml_model_version_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MlModelVersionListResponseDto extends MlModelVersionListResponseDto {
  @override
  final BuiltList<MlModelVersionDto> versions;

  factory _$MlModelVersionListResponseDto(
          [void Function(MlModelVersionListResponseDtoBuilder)? updates]) =>
      (new MlModelVersionListResponseDtoBuilder()..update(updates))._build();

  _$MlModelVersionListResponseDto._({required this.versions}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        versions, r'MlModelVersionListResponseDto', 'versions');
  }

  @override
  MlModelVersionListResponseDto rebuild(
          void Function(MlModelVersionListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MlModelVersionListResponseDtoBuilder toBuilder() =>
      new MlModelVersionListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MlModelVersionListResponseDto && versions == other.versions;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, versions.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MlModelVersionListResponseDto')
          ..add('versions', versions))
        .toString();
  }
}

class MlModelVersionListResponseDtoBuilder
    implements
        Builder<MlModelVersionListResponseDto,
            MlModelVersionListResponseDtoBuilder> {
  _$MlModelVersionListResponseDto? _$v;

  ListBuilder<MlModelVersionDto>? _versions;
  ListBuilder<MlModelVersionDto> get versions =>
      _$this._versions ??= new ListBuilder<MlModelVersionDto>();
  set versions(ListBuilder<MlModelVersionDto>? versions) =>
      _$this._versions = versions;

  MlModelVersionListResponseDtoBuilder() {
    MlModelVersionListResponseDto._defaults(this);
  }

  MlModelVersionListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _versions = $v.versions.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MlModelVersionListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$MlModelVersionListResponseDto;
  }

  @override
  void update(void Function(MlModelVersionListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MlModelVersionListResponseDto build() => _build();

  _$MlModelVersionListResponseDto _build() {
    _$MlModelVersionListResponseDto _$result;
    try {
      _$result = _$v ??
          new _$MlModelVersionListResponseDto._(versions: versions.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'versions';
        versions.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'MlModelVersionListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
