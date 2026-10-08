//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'duplicate_stack_keep_version_request_dto.g.dart';

/// DuplicateStackKeepVersionRequestDto
///
/// Properties:
/// * [versionDocumentId] 
@BuiltValue()
abstract class DuplicateStackKeepVersionRequestDto implements Built<DuplicateStackKeepVersionRequestDto, DuplicateStackKeepVersionRequestDtoBuilder> {
  @BuiltValueField(wireName: r'versionDocumentId')
  String get versionDocumentId;

  DuplicateStackKeepVersionRequestDto._();

  factory DuplicateStackKeepVersionRequestDto([void updates(DuplicateStackKeepVersionRequestDtoBuilder b)]) = _$DuplicateStackKeepVersionRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DuplicateStackKeepVersionRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DuplicateStackKeepVersionRequestDto> get serializer => _$DuplicateStackKeepVersionRequestDtoSerializer();
}

class _$DuplicateStackKeepVersionRequestDtoSerializer implements PrimitiveSerializer<DuplicateStackKeepVersionRequestDto> {
  @override
  final Iterable<Type> types = const [DuplicateStackKeepVersionRequestDto, _$DuplicateStackKeepVersionRequestDto];

  @override
  final String wireName = r'DuplicateStackKeepVersionRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DuplicateStackKeepVersionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'versionDocumentId';
    yield serializers.serialize(
      object.versionDocumentId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DuplicateStackKeepVersionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DuplicateStackKeepVersionRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'versionDocumentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.versionDocumentId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DuplicateStackKeepVersionRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DuplicateStackKeepVersionRequestDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

